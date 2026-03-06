import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { db, type UserRow } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../validation/auth.js";
import type { JwtPayload } from "../types.js";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "入力内容に誤りがあります。",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = (await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail)) as { id: number } | undefined;
  if (existing) {
    res.status(409).json({ error: "このメールアドレスは既に登録されています。" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const result = await db
    .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
    .run(normalizedEmail, passwordHash, name.trim());

  const user = (await db.prepare("SELECT id, email, name, created_at FROM users WHERE id = ?").get(result.lastInsertRowid)) as Omit<UserRow, "password_hash"> & { created_at: string };
  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    message: "登録が完了しました。",
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "入力内容に誤りがあります。",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = (await db.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").get(normalizedEmail)) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    message: "ログインしました。",
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.get("/me", requireAuth, async (req: Request & { userId: number }, res: Response) => {
  const user = (await db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(req.userId)) as { id: number; email: string; name: string } | undefined;
  if (!user) {
    res.status(404).json({ error: "ユーザーが見つかりません。" });
    return;
  }
  res.json({ user });
});

// Google OAuth handlers (also mounted on app in index.ts so route is always registered)
export function handleGoogleRedirect(req: Request, res: Response) {
  if (!config.googleClientId) {
    res.redirect(`${config.frontendUrl}/login?error=google_not_configured`);
    return;
  }
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(url);
}

router.get("/google", handleGoogleRedirect);

export async function handleGoogleCallback(req: Request, res: Response) {
  const { code, error } = req.query;
  const frontendLogin = `${config.frontendUrl}/login`;

  if (error || typeof code !== "string") {
    res.redirect(`${frontendLogin}?error=access_denied`);
    return;
  }
  if (!config.googleClientId || !config.googleClientSecret) {
    res.redirect(`${frontendLogin}?error=google_not_configured`);
    return;
  }

  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    res.redirect(`${frontendLogin}?error=token_exchange_failed`);
    return;
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    res.redirect(`${frontendLogin}?error=no_access_token`);
    return;
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    res.redirect(`${frontendLogin}?error=userinfo_failed`);
    return;
  }
  const profile = (await userRes.json()) as { email?: string; name?: string };
  const email = profile.email?.trim().toLowerCase();
  if (!email) {
    res.redirect(`${frontendLogin}?error=no_email`);
    return;
  }
  const name = (profile.name || email.split("@")[0] || "User").trim();

  let user = (await db.prepare("SELECT id, email, name FROM users WHERE email = ?").get(email)) as { id: number; email: string; name: string } | undefined;
  if (!user) {
    const placeholderHash = await bcrypt.hash("google-oauth-placeholder", config.bcryptRounds);
    await db.prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)").run(email, placeholderHash, name);
    user = (await db.prepare("SELECT id, email, name FROM users WHERE email = ?").get(email)) as { id: number; email: string; name: string };
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  res.redirect(`${frontendLogin}?token=${encodeURIComponent(token)}`);
}

router.get("/google/callback", async (req: Request, res: Response) => {
  await handleGoogleCallback(req, res);
});

export default router;

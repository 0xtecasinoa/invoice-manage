import { Router, Response } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rows = (await db.prepare(
    "SELECT * FROM client_formats WHERE user_id = ? ORDER BY client_name, format_name"
  ).all(req.userId)) as Record<string, unknown>[];
  const clientFormats = rows.map((r) => ({
    id: String(r.id),
    clientName: r.client_name,
    clientCode: r.client_code,
    formatName: r.format_name,
    fields: JSON.parse((r.fields_json as string) || "[]") as string[],
  }));
  res.json({ clientFormats });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    clientName: string;
    clientCode: string;
    formatName: string;
    fields: string[];
  };
  if (!body.clientName || !body.formatName || !Array.isArray(body.fields)) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const r = await db.prepare(`
    INSERT INTO client_formats (user_id, client_name, client_code, format_name, fields_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.userId,
    body.clientName,
    body.clientCode ?? "",
    body.formatName,
    JSON.stringify(body.fields ?? [])
  );
  const row = (await db.prepare("SELECT * FROM client_formats WHERE id = ?").get(r.lastInsertRowid)) as Record<string, unknown>;
  res.status(201).json({
    id: String(row.id),
    clientName: row.client_name,
    clientCode: row.client_code,
    formatName: row.format_name,
    fields: JSON.parse((row.fields_json as string) || "[]") as string[],
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT id FROM client_formats WHERE id = ? AND user_id = ?").get(id, req.userId);
  if (!existing) {
    res.status(404).json({ error: "書式が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.clientName != null) { updates.push("client_name = ?"); values.push(body.clientName); }
  if (body.clientCode != null) { updates.push("client_code = ?"); values.push(body.clientCode); }
  if (body.formatName != null) { updates.push("format_name = ?"); values.push(body.formatName); }
  if (body.fields != null) { updates.push("fields_json = ?"); values.push(JSON.stringify(body.fields)); }
  if (updates.length === 0) {
    res.status(400).json({ error: "更新する項目がありません。" });
    return;
  }
  values.push(id);
  await db.prepare(`UPDATE client_formats SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));
  const row = (await db.prepare("SELECT * FROM client_formats WHERE id = ?").get(id)) as Record<string, unknown>;
  res.json({
    id: String(row.id),
    clientName: row.client_name,
    clientCode: row.client_code,
    formatName: row.format_name,
    fields: JSON.parse((row.fields_json as string) || "[]") as string[],
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM client_formats WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "書式が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

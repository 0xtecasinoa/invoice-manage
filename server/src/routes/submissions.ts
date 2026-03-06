import { Router, Response } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rows = (await db.prepare(
    "SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_date DESC, id DESC"
  ).all(req.userId)) as Record<string, unknown>[];
  const submissions = rows.map((r) => ({
    id: String(r.id),
    invoiceId: String(r.invoice_id),
    invoiceNumber: r.invoice_number,
    projectName: r.project_name,
    client: r.client,
    submittedDate: r.submitted_date,
    status: r.status,
    notes: r.notes || "",
  }));
  res.json({ submissions });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    invoiceId: string | number;
    invoiceNumber: string;
    projectName: string;
    client: string;
    submittedDate: string;
    status?: "pending" | "accepted" | "rejected" | "resubmit_required";
    notes?: string;
  };
  if (body.invoiceId == null || !body.invoiceNumber || !body.projectName || !body.client || !body.submittedDate) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const invoiceId = typeof body.invoiceId === "string" ? parseInt(body.invoiceId, 10) : body.invoiceId;
  const r = await db.prepare(`
    INSERT INTO submissions (user_id, invoice_id, invoice_number, project_name, client, submitted_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    invoiceId,
    body.invoiceNumber,
    body.projectName,
    body.client,
    body.submittedDate,
    body.status ?? "pending",
    body.notes ?? ""
  );
  const row = (await db.prepare("SELECT * FROM submissions WHERE id = ?").get(r.lastInsertRowid)) as Record<string, unknown>;
  res.status(201).json({
    id: String(row.id),
    invoiceId: String(row.invoice_id),
    invoiceNumber: row.invoice_number,
    projectName: row.project_name,
    client: row.client,
    submittedDate: row.submitted_date,
    status: row.status,
    notes: row.notes || "",
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT id FROM submissions WHERE id = ? AND user_id = ?").get(id, req.userId);
  if (!existing) {
    res.status(404).json({ error: "提出記録が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.status != null) { updates.push("status = ?"); values.push(body.status); }
  if (body.notes != null) { updates.push("notes = ?"); values.push(body.notes); }
  if (updates.length === 0) {
    res.status(400).json({ error: "更新する項目がありません。" });
    return;
  }
  values.push(id);
  await db.prepare(`UPDATE submissions SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));
  const row = (await db.prepare("SELECT * FROM submissions WHERE id = ?").get(id)) as Record<string, unknown>;
  res.json({
    id: String(row.id),
    invoiceId: String(row.invoice_id),
    invoiceNumber: row.invoice_number,
    projectName: row.project_name,
    client: row.client,
    submittedDate: row.submitted_date,
    status: row.status,
    notes: row.notes || "",
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM submissions WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "提出記録が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

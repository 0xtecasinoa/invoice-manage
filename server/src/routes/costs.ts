import { Router, Response } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rows = (await db.prepare(
    "SELECT * FROM cost_entries WHERE user_id = ? ORDER BY entry_date DESC, id DESC"
  ).all(req.userId)) as Record<string, unknown>[];
  const costs = rows.map((r) => ({
    id: String(r.id),
    projectId: String(r.project_id),
    projectName: r.project_name,
    category: r.category,
    description: r.description,
    budgetAmount: Number(r.budget_amount),
    actualAmount: Number(r.actual_amount),
    difference: Number(r.difference),
    date: r.entry_date,
  }));
  res.json({ costs });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    projectId: string | number;
    projectName: string;
    category: string;
    description: string;
    budgetAmount: number;
    actualAmount: number;
    date: string;
  };
  if (body.projectId == null || !body.projectName || !body.category || body.description == null || !body.date) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const projectId = typeof body.projectId === "string" ? parseInt(body.projectId, 10) : body.projectId;
  const difference = (body.actualAmount ?? 0) - (body.budgetAmount ?? 0);
  const r = await db.prepare(`
    INSERT INTO cost_entries (user_id, project_id, project_name, category, description, budget_amount, actual_amount, difference, entry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    projectId,
    body.projectName ?? "",
    body.category ?? "",
    body.description ?? "",
    body.budgetAmount ?? 0,
    body.actualAmount ?? 0,
    difference,
    body.date
  );
  const row = (await db.prepare("SELECT * FROM cost_entries WHERE id = ?").get(r.lastInsertRowid)) as Record<string, unknown>;
  res.status(201).json({
    id: String(row.id),
    projectId: String(row.project_id),
    projectName: row.project_name,
    category: row.category,
    description: row.description,
    budgetAmount: Number(row.budget_amount),
    actualAmount: Number(row.actual_amount),
    difference: Number(row.difference),
    date: row.entry_date,
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = (await db.prepare("SELECT * FROM cost_entries WHERE id = ? AND user_id = ?").get(id, req.userId)) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: "原価記録が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.category != null) { updates.push("category = ?"); values.push(body.category); }
  if (body.description != null) { updates.push("description = ?"); values.push(body.description); }
  if (body.budgetAmount != null) { updates.push("budget_amount = ?"); values.push(body.budgetAmount); }
  if (body.actualAmount != null) { updates.push("actual_amount = ?"); values.push(body.actualAmount); }
  if (body.date != null) { updates.push("entry_date = ?"); values.push(body.date); }
  if (body.actualAmount != null || body.budgetAmount != null) {
    const b = Number(body.budgetAmount ?? existing.budget_amount);
    const a = Number(body.actualAmount ?? existing.actual_amount);
    updates.push("difference = ?");
    values.push(a - b);
  }
  if (updates.length === 0) {
    res.status(400).json({ error: "更新する項目がありません。" });
    return;
  }
  values.push(id);
  await db.prepare(`UPDATE cost_entries SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));
  const row = (await db.prepare("SELECT * FROM cost_entries WHERE id = ?").get(id)) as Record<string, unknown>;
  res.json({
    id: String(row.id),
    projectId: String(row.project_id),
    projectName: row.project_name,
    category: row.category,
    description: row.description,
    budgetAmount: Number(row.budget_amount),
    actualAmount: Number(row.actual_amount),
    difference: Number(row.difference),
    date: row.entry_date,
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM cost_entries WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "原価記録が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

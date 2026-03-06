import { Router, Response } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rows = (await db.prepare(
    "SELECT * FROM construction_records WHERE user_id = ? ORDER BY record_date DESC, id DESC"
  ).all(req.userId)) as Record<string, unknown>[];
  const records = rows.map((r) => ({
    id: String(r.id),
    projectId: String(r.project_id),
    projectName: r.project_name,
    date: r.record_date,
    description: r.description,
    workTypeName: r.work_type_name ?? undefined,
    productName: r.product_name ?? undefined,
    spec: r.spec ?? undefined,
    quantity: Number(r.quantity),
    unit: r.unit,
    unitPrice: Number(r.unit_price),
    amount: Number(r.amount),
    remarks: r.remarks || "",
    taxCategory: (r.tax_category as string) || undefined,
  }));
  res.json({ records });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    projectId: string | number;
    projectName: string;
    date: string;
    description: string;
    workTypeName?: string;
    productName?: string;
    spec?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    remarks?: string;
    taxCategory?: string;
  };
  if (!body.projectId || body.projectName == null || !body.date || body.description == null) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const projectId = typeof body.projectId === "string" ? parseInt(body.projectId, 10) : body.projectId;
  const amount = body.amount ?? body.quantity * body.unitPrice;
  const r = await db.prepare(`
    INSERT INTO construction_records (user_id, project_id, project_name, record_date, description, work_type_name, product_name, spec, quantity, unit, unit_price, amount, remarks, tax_category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    projectId,
    body.projectName ?? "",
    body.date,
    body.description ?? "",
    body.workTypeName ?? null,
    body.productName ?? null,
    body.spec ?? null,
    body.quantity ?? 0,
    body.unit ?? "㎡",
    body.unitPrice ?? 0,
    amount,
    body.remarks ?? "",
    body.taxCategory ?? null
  );
  const row = (await db.prepare("SELECT * FROM construction_records WHERE id = ?").get(r.lastInsertRowid)) as Record<string, unknown>;
  res.status(201).json({
    id: String(row.id),
    projectId: String(row.project_id),
    projectName: row.project_name,
    date: row.record_date,
    description: row.description,
    workTypeName: row.work_type_name ?? undefined,
    productName: row.product_name ?? undefined,
    spec: row.spec ?? undefined,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
    remarks: row.remarks || "",
    taxCategory: (row.tax_category as string) || undefined,
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = (await db.prepare("SELECT * FROM construction_records WHERE id = ? AND user_id = ?").get(id, req.userId)) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: "施工実績が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const allowed = ["projectId", "projectName", "date", "description", "quantity", "unit", "unitPrice", "amount", "remarks"];
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.date != null) { updates.push("record_date = ?"); values.push(body.date); }
  if (body.description != null) { updates.push("description = ?"); values.push(body.description); }
  if (body.projectName != null) { updates.push("project_name = ?"); values.push(body.projectName); }
  if (body.quantity != null) { updates.push("quantity = ?"); values.push(body.quantity); }
  if (body.unit != null) { updates.push("unit = ?"); values.push(body.unit); }
  if (body.unitPrice != null) { updates.push("unit_price = ?"); values.push(body.unitPrice); }
  if (body.amount != null) { updates.push("amount = ?"); values.push(body.amount); }
  if (body.remarks != null) { updates.push("remarks = ?"); values.push(body.remarks); }
  if (body.projectId != null) { updates.push("project_id = ?"); values.push(typeof body.projectId === "string" ? parseInt(body.projectId, 10) : body.projectId); }
  if (updates.length === 0) {
    res.status(400).json({ error: "更新する項目がありません。" });
    return;
  }
  values.push(id);
  await db.prepare(`UPDATE construction_records SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));
  const row = (await db.prepare("SELECT * FROM construction_records WHERE id = ?").get(id)) as Record<string, unknown>;
  res.json({
    id: String(row.id),
    projectId: String(row.project_id),
    projectName: row.project_name,
    date: row.record_date,
    description: row.description,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
    remarks: row.remarks || "",
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM construction_records WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "施工実績が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

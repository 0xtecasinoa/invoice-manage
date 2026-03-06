import { Router, Response } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const router = Router();
router.use(requireAuth);

function lineItemFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    date: row.item_date,
    description: row.description,
    workTypeName: row.work_type_name ?? undefined,
    productName: row.product_name ?? undefined,
    spec: row.spec ?? undefined,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
    taxRate: Number(row.tax_rate),
    tax: Number(row.tax),
    taxCategory: (row.tax_category as string) || undefined,
  };
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rows = (await db.prepare(
    "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.userId)) as Record<string, unknown>[];

  const projects = await Promise.all(rows.map(async (p) => {
    const items = (await db.prepare(
      "SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order, id"
    ).all(p.id)) as Record<string, unknown>[];
    return {
      id: String(p.id),
      projectNumber: p.project_number,
      name: p.name,
      client: p.client,
      clientCode: p.client_code,
      status: p.status,
      estimateDate: p.estimate_date,
      dueDate: p.due_date,
      items: items.map(lineItemFromRow),
      subtotal: Number(p.subtotal),
      taxTotal: Number(p.tax_total),
      total: Number(p.total),
      notes: p.notes || "",
    };
  }));
  res.json({ projects });
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const row = (await db.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).get(Number(req.params.id), req.userId)) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: "案件が見つかりません。" });
    return;
  }
  const items = (await db.prepare(
    "SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order, id"
  ).all(row.id)) as Record<string, unknown>[];
  res.json({
    id: String(row.id),
    projectNumber: row.project_number,
    name: row.name,
    client: row.client,
    clientCode: row.client_code,
    status: row.status,
    estimateDate: row.estimate_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    notes: row.notes || "",
  });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    projectNumber?: string;
    name: string;
    client: string;
    clientCode: string;
    dueDate: string;
    items: Array<{
      date: string;
      description: string;
      workTypeName?: string;
      productName?: string;
      spec?: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      amount: number;
      taxRate: number;
      tax: number;
      taxCategory?: string;
    }>;
    notes?: string;
  };
  if (!body.name || !body.client || !body.dueDate || !Array.isArray(body.items)) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const estimateDate = new Date().toISOString().slice(0, 10);
  const subtotal = body.items.reduce((s, i) => s + (i.amount ?? i.quantity * i.unitPrice), 0);
  const taxTotal = body.items.reduce((s, i) => s + (i.tax ?? 0), 0);
  const total = subtotal + taxTotal;

  let projectNumber = body.projectNumber;
  if (!projectNumber) {
    const count = (await db.prepare("SELECT COUNT(*) as c FROM projects WHERE user_id = ?").get(req.userId)) as { c: number };
    projectNumber = `KJ-${new Date().getFullYear()}-${String(count.c + 1).padStart(3, "0")}`;
  }

  const r = await db.prepare(`
    INSERT INTO projects (user_id, project_number, name, client, client_code, status, estimate_date, due_date, subtotal, tax_total, total, notes)
    VALUES (?, ?, ?, ?, ?, 'estimate_draft', ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    projectNumber,
    body.name,
    body.client,
    body.clientCode ?? "",
    estimateDate,
    body.dueDate,
    subtotal,
    taxTotal,
    total,
    body.notes ?? ""
  );

  const projectId = r.lastInsertRowid as number;
  const insertItem = db.prepare(`
    INSERT INTO project_items (project_id, item_date, description, work_type_name, product_name, spec, quantity, unit, unit_price, amount, tax_rate, tax, tax_category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    const amount = item.amount ?? item.quantity * item.unitPrice;
    const tax = item.tax ?? Math.floor(amount * (item.taxRate || 10) / 100);
    await insertItem.run(
      projectId,
      item.date || estimateDate,
      item.description ?? "",
      item.workTypeName ?? null,
      item.productName ?? null,
      item.spec ?? null,
      item.quantity,
      item.unit ?? "㎡",
      item.unitPrice,
      amount,
      item.taxRate ?? 10,
      tax,
      item.taxCategory ?? null,
      i
    );
  }

  const row = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId)) as Record<string, unknown>;
  const items = (await db.prepare("SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order, id").all(projectId)) as Record<string, unknown>[];
  res.status(201).json({
    id: String(row.id),
    projectNumber: row.project_number,
    name: row.name,
    client: row.client,
    clientCode: row.client_code,
    status: row.status,
    estimateDate: row.estimate_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    notes: row.notes || "",
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?").get(id, req.userId);
  if (!existing) {
    res.status(404).json({ error: "案件が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.status != null) { updates.push("status = ?"); values.push(body.status); }
  if (body.name != null) { updates.push("name = ?"); values.push(body.name); }
  if (body.client != null) { updates.push("client = ?"); values.push(body.client); }
  if (body.clientCode != null) { updates.push("client_code = ?"); values.push(body.clientCode); }
  if (body.dueDate != null) { updates.push("due_date = ?"); values.push(body.dueDate); }
  if (body.notes != null) { updates.push("notes = ?"); values.push(body.notes); }
  if (body.subtotal != null) { updates.push("subtotal = ?"); values.push(body.subtotal); }
  if (body.taxTotal != null) { updates.push("tax_total = ?"); values.push(body.taxTotal); }
  if (body.total != null) { updates.push("total = ?"); values.push(body.total); }
  if (updates.length === 0) {
    res.status(400).json({ error: "更新する項目がありません。" });
    return;
  }
  updates.push("updated_at = NOW()");
  values.push(id);
  await db.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));

  if (Array.isArray(body.items)) {
    await db.prepare("DELETE FROM project_items WHERE project_id = ?").run(id);
    const insertItem = db.prepare(`
      INSERT INTO project_items (project_id, item_date, description, work_type_name, product_name, spec, quantity, unit, unit_price, amount, tax_rate, tax, tax_category, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < (body.items as Array<Record<string, unknown>>).length; i++) {
      const item = (body.items as Array<Record<string, unknown>>)[i];
      const amount = Number(item.amount ?? (Number(item.quantity) * Number(item.unitPrice)));
      const tax = Number(item.tax ?? 0);
      await insertItem.run(
        id,
        item.date ?? new Date().toISOString().slice(0, 10),
        item.description ?? "",
        item.workTypeName ?? null,
        item.productName ?? null,
        item.spec ?? null,
        item.quantity ?? 0,
        item.unit ?? "㎡",
        item.unitPrice ?? 0,
        amount,
        item.taxRate ?? 10,
        tax,
        item.taxCategory ?? null,
        i
      );
    }
  }

  const row = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as Record<string, unknown>;
  const items = (await db.prepare("SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order, id").all(id)) as Record<string, unknown>[];
  res.json({
    id: String(row.id),
    projectNumber: row.project_number,
    name: row.name,
    client: row.client,
    clientCode: row.client_code,
    status: row.status,
    estimateDate: row.estimate_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    notes: row.notes || "",
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "案件が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

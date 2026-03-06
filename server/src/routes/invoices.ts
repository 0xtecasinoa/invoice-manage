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
    "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.userId)) as Record<string, unknown>[];

  const invoices = await Promise.all(rows.map(async (inv) => {
    const items = (await db.prepare(
      "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id"
    ).all(inv.id)) as Record<string, unknown>[];
    return {
      id: String(inv.id),
      invoiceNumber: inv.invoice_number,
      projectId: String(inv.project_id),
      projectName: inv.project_name,
      client: inv.client,
      clientCode: inv.client_code,
      format: inv.format,
      clientFormatId: inv.client_format_id != null ? String(inv.client_format_id) : undefined,
      status: inv.status,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      items: items.map(lineItemFromRow),
      subtotal: Number(inv.subtotal),
      taxTotal: Number(inv.tax_total),
      total: Number(inv.total),
    };
  }));
  res.json({ invoices });
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const row = (await db.prepare(
    "SELECT * FROM invoices WHERE id = ? AND user_id = ?"
  ).get(Number(req.params.id), req.userId)) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: "請求書が見つかりません。" });
    return;
  }
  const items = (await db.prepare(
    "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id"
  ).all(row.id)) as Record<string, unknown>[];
  res.json({
    id: String(row.id),
    invoiceNumber: row.invoice_number,
    projectId: String(row.project_id),
    projectName: row.project_name,
    client: row.client,
    clientCode: row.client_code,
    format: row.format,
    clientFormatId: row.client_format_id != null ? String(row.client_format_id) : undefined,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
  });
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    invoiceNumber?: string;
    projectId: string | number;
    projectName: string;
    client: string;
    clientCode: string;
    format: "自社書式" | "元請書式";
    clientFormatId?: string | number | null;
    issueDate: string;
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
  };
  if (body.projectId == null || !body.projectName || !body.client || !body.issueDate || !body.dueDate || !Array.isArray(body.items)) {
    res.status(400).json({ error: "必須項目が不足しています。" });
    return;
  }
  const subtotal = body.items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const taxTotal = body.items.reduce((s, i) => s + (i.tax ?? 0), 0);
  const total = subtotal + taxTotal;

  let invoiceNumber = body.invoiceNumber;
  if (!invoiceNumber) {
    const count = (await db.prepare("SELECT COUNT(*) as c FROM invoices WHERE user_id = ?").get(req.userId)) as { c: number };
    invoiceNumber = `INV-${new Date().getFullYear()}-${String(count.c + 1).padStart(3, "0")}`;
  }

  const projectId = typeof body.projectId === "string" ? parseInt(body.projectId, 10) : body.projectId;
  const clientFormatId = body.clientFormatId == null ? null : (typeof body.clientFormatId === "string" ? parseInt(body.clientFormatId, 10) : body.clientFormatId);

  const r = await db.prepare(`
    INSERT INTO invoices (user_id, invoice_number, project_id, project_name, client, client_code, format, client_format_id, status, issue_date, due_date, subtotal, tax_total, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    invoiceNumber,
    projectId,
    body.projectName,
    body.client,
    body.clientCode ?? "",
    body.format,
    clientFormatId,
    body.issueDate,
    body.dueDate,
    subtotal,
    taxTotal,
    total
  );

  const invoiceId = r.lastInsertRowid as number;
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, item_date, description, work_type_name, product_name, spec, quantity, unit, unit_price, amount, tax_rate, tax, tax_category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    const amount = item.amount ?? item.quantity * item.unitPrice;
    const tax = item.tax ?? Math.floor(amount * (item.taxRate || 10) / 100);
    await insertItem.run(
      invoiceId,
      item.date ?? new Date().toISOString().slice(0, 10),
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

  const row = (await db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId)) as Record<string, unknown>;
  const items = (await db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id").all(invoiceId)) as Record<string, unknown>[];
  res.status(201).json({
    id: String(row.id),
    invoiceNumber: row.invoice_number,
    projectId: String(row.project_id),
    projectName: row.project_name,
    client: row.client,
    clientCode: row.client_code,
    format: row.format,
    clientFormatId: row.client_format_id != null ? String(row.client_format_id) : undefined,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
  });
});

router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT id FROM invoices WHERE id = ? AND user_id = ?").get(id, req.userId);
  if (!existing) {
    res.status(404).json({ error: "請求書が見つかりません。" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.status != null) { updates.push("status = ?"); values.push(body.status); }
  if (body.issueDate != null) { updates.push("issue_date = ?"); values.push(body.issueDate); }
  if (body.dueDate != null) { updates.push("due_date = ?"); values.push(body.dueDate); }
  if (body.subtotal != null) { updates.push("subtotal = ?"); values.push(body.subtotal); }
  if (body.taxTotal != null) { updates.push("tax_total = ?"); values.push(body.taxTotal); }
  if (body.total != null) { updates.push("total = ?"); values.push(body.total); }
  if (updates.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE invoices SET ${updates.join(", ")} WHERE id = ?`).run(...(values as (string | number)[]));
  }
  if (Array.isArray(body.items)) {
    await db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, item_date, description, work_type_name, product_name, spec, quantity, unit, unit_price, amount, tax_rate, tax, tax_category, sort_order)
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

  const row = (await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id)) as Record<string, unknown>;
  const items = (await db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id").all(id)) as Record<string, unknown>[];
  res.json({
    id: String(row.id),
    invoiceNumber: row.invoice_number,
    projectId: String(row.project_id),
    projectName: row.project_name,
    client: row.client,
    clientCode: row.client_code,
    format: row.format,
    clientFormatId: row.client_format_id != null ? String(row.client_format_id) : undefined,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: items.map(lineItemFromRow),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
  });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const r = await db.prepare("DELETE FROM invoices WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.userId);
  if (r.changes === 0) {
    res.status(404).json({ error: "請求書が見つかりません。" });
    return;
  }
  res.status(204).send();
});

export default router;

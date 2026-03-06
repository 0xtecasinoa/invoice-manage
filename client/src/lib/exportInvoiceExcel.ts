import * as XLSX from "xlsx";
import type { Invoice } from "@/types/construction";
import type { CompanyInfo } from "./companyInfo";
import { TAX_CATEGORY_LABELS } from "@/types/construction";

function toAoa(
  titleRows: (string | number)[][],
  headers: string[],
  rows: (string | number)[][],
  footerRows: (string | number)[][]
): (string | number)[][] {
  return [...titleRows, headers, ...rows, ...footerRows];
}

/** 自社書式：請求書＋内訳 */
function buildJishaSheet(inv: Invoice, company: CompanyInfo): (string | number)[][] {
  const title: (string | number)[][] = [
    ["請求書"],
    [""],
    [`${inv.client} 御中`, "", company.name, company.address, `登録番号 ${company.registrationNumber}`],
    ["工事名", inv.projectName, "請求書番号", inv.invoiceNumber, "発行日", inv.issueDate, "支払期日", inv.dueDate],
    [""],
  ];
  const headers = ["月日", "摘要（工種名・品名・規格）", "単位", "数量", "単価", "金額", "消費税"];
  const rows = inv.items.map((i) => [
    i.date,
    i.description,
    i.unit,
    i.quantity,
    i.unitPrice,
    i.amount,
    i.tax,
  ]);
  const footer: (string | number)[][] = [
    [""],
    ["", "", "", "", "小計（税抜）", inv.subtotal],
    ["", "", "", "", "消費税額", inv.taxTotal],
    ["", "", "", "", "合計（税込）", inv.total],
    [""],
    ["振込先", company.bankName || "", company.accountType || "", company.accountNumber || "", company.accountHolder || ""],
    [""],
    [company.name],
  ];
  return toAoa(title, headers, rows, footer);
}

/** 様式4-2：請求内訳書 */
function buildYoshiki42Sheet(inv: Invoice, company: CompanyInfo): (string | number)[][] {
  const title: (string | number)[][] = [
    ["（様式4-2）"],
    ["工事名", inv.projectName],
    ["請 求 内 訳 書"],
    [""],
  ];
  const headers = ["称規", "格数", "量", "単位", "単価", "金額", "支給区分", "摘要"];
  const rows = inv.items.map((i) => [
    i.description,
    i.quantity,
    i.quantity,
    i.unit,
    i.unitPrice,
    i.amount,
    "",
    "",
  ]);
  const footer: (string | number)[][] = [
    [""],
    ["合", "", "", "", "", "計", inv.total],
    [""],
    [company.name],
  ];
  return toAoa(title, headers, rows, footer);
}

/** 外注用請求書 */
function buildGaichuSheet(inv: Invoice, company: CompanyInfo): (string | number)[][] {
  const title: (string | number)[][] = [
    [inv.client, "御中", "", "請求書", "（外注用）"],
    ["当月請求金額", inv.total, "本体価格", inv.subtotal, "消費税額", inv.taxTotal, "取引先コード", inv.clientCode],
    ["", "", "", "登録番号", company.registrationNumber, "", "住所", company.address],
    ["", "", "", company.name, company.representative, company.tel],
    ["工事名称", inv.projectName],
    ["施工場所", ""],
    ["個別外注注文番号", ""],
    [""],
  ];
  const headers = ["月日", "名称", "数量", "単位", "単価", "税抜金額", "消費税率/額", "費目", "税込金額", "税区分"];
  const rows = inv.items.map((i) => [
    i.date,
    i.description,
    i.quantity,
    i.unit,
    i.unitPrice,
    i.amount,
    `${i.taxRate}%`,
    "",
    i.amount + i.tax,
    i.taxCategory ? TAX_CATEGORY_LABELS[i.taxCategory] : "",
  ]);
  const footer: (string | number)[][] = [
    [""],
    ["課税対象外", 0],
    ["8%対象", 0],
    ["10%対象", inv.subtotal],
    ["請求額計", inv.total],
    [""],
    ["振込先", company.bankName || "", company.accountType || "", company.accountNumber || "", company.accountHolder || ""],
    [""],
    ["所長", ""],
  ];
  return toAoa(title, headers, rows, footer);
}

/** 提出用請求書 */
function buildTeishutsuSheet(inv: Invoice, company: CompanyInfo): (string | number)[][] {
  const title: (string | number)[][] = [
    ["請求書", "", "提出用"],
    [inv.client, "御中", "", "取引先コード", inv.clientCode, "登録番号", company.registrationNumber],
    ["工事名", inv.projectName, "", company.name, company.address],
    ["工事番号", inv.clientCode, "納入年月", inv.issueDate, "提出日", inv.issueDate, company.representative, company.tel],
    ["前月までの契約額", inv.subtotal, "当月変更額", 0, "契約額合計", inv.subtotal],
    ["消費税額", inv.taxTotal, "消費税率", "10%", "総請求額", inv.total],
    [""],
  ];
  const headers = ["月日", "摘要（工種名・品名・規格）", "単位", "数量", "単価", "金額", "検収・区分欄"];
  const rows = inv.items.map((i) => [
    i.date,
    i.description,
    i.unit,
    i.quantity,
    i.unitPrice,
    i.amount,
    "",
  ]);
  const footer: (string | number)[][] = [
    [""],
    ["小計", inv.subtotal],
    ["今回請求額（本体金額）", inv.subtotal],
    [""],
    [company.name],
  ];
  return toAoa(title, headers, rows, footer);
}

function getSheetData(
  inv: Invoice,
  company: CompanyInfo,
  formatName?: string
): (string | number)[][] {
  const name = (formatName || "").toLowerCase();
  if (name.includes("様式4-2") || name.includes("請求内訳書")) return buildYoshiki42Sheet(inv, company);
  if (name.includes("外注用")) return buildGaichuSheet(inv, company);
  if (name.includes("提出用") || name.includes("提出")) return buildTeishutsuSheet(inv, company);
  return buildJishaSheet(inv, company);
}

/**
 * 請求書をExcelで出力する。書式に合わせたシートでダウンロードする。
 */
export function exportInvoiceToExcel(
  invoice: Invoice,
  company: CompanyInfo,
  formatName?: string
): void {
  const data = getSheetData(invoice, company, formatName);
  const ws = XLSX.utils.aoa_to_sheet(data);

  const colWidths = data[0]?.map((_, i) => {
    const maxLen = Math.max(
      ...data.map((row) => String(row[i] ?? "").length),
      12
    );
    return { wch: Math.min(maxLen + 2, 50) };
  }) ?? [];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  const sheetName = "請求書";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeName = (invoice.invoiceNumber || "invoice").replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff-]/g, "_");
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}

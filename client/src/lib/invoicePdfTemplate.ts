import type { Invoice, LineItem } from "@/types/construction";
import type { CompanyInfo } from "./companyInfo";
import { TAX_CATEGORY_LABELS } from "@/types/construction";

const fmt = (n: number) => `¥${n.toLocaleString()}`;

/** 自社書式：請求書＋内訳（月日・摘要・単位・数量・単価・金額・消費税） */
function buildJishaHtml(inv: Invoice, company: CompanyInfo): string {
  const rows = inv.items
    .map(
      (i) => `
    <tr>
      <td class="border px-2 py-1 text-sm">${i.date}</td>
      <td class="border px-2 py-1 text-sm">${escapeHtml(i.description)}</td>
      <td class="border px-2 py-1 text-sm text-center">${i.unit}</td>
      <td class="border px-2 py-1 text-sm text-right">${i.quantity.toLocaleString()}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.unitPrice)}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.amount)}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.tax)}</td>
    </tr>`
    )
    .join("");
  return `
  <div class="invoice-pdf jisha" style="font-family: 'Hiragino Sans','Meiryo',sans-serif; padding: 24px; max-width: 210mm;">
    <h1 style="font-size: 22px; text-align: center; margin-bottom: 24px;">請求書</h1>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <div>
        <p style="font-size: 14px; font-weight: bold;">${escapeHtml(inv.client)} 御中</p>
      </div>
      <div style="text-align: right; font-size: 12px;">
        <p>${escapeHtml(company.name)}</p>
        <p>${escapeHtml(company.address)}</p>
        <p>インボイス登録番号 ${escapeHtml(company.registrationNumber)}</p>
        <p>${escapeHtml(company.representative)}</p>
        <p>TEL ${escapeHtml(company.tel)}</p>
      </div>
    </div>
    <div style="margin-bottom: 12px; font-size: 13px;">
      <span>工事名：</span><span class="font-bold">${escapeHtml(inv.projectName)}</span>
      <span style="margin-left: 24px;">請求書番号：</span><span>${escapeHtml(inv.invoiceNumber)}</span>
      <span style="margin-left: 24px;">発行日：</span><span>${inv.issueDate}</span>
      <span style="margin-left: 24px;">支払期日：</span><span>${inv.dueDate}</span>
    </div>
    <table class="w-full" style="border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-2 text-left">月日</th>
          <th class="border px-2 py-2 text-left">摘要（工種名・品名・規格）</th>
          <th class="border px-2 py-2 text-center">単位</th>
          <th class="border px-2 py-2 text-right">数量</th>
          <th class="border px-2 py-2 text-right">単価</th>
          <th class="border px-2 py-2 text-right">金額</th>
          <th class="border px-2 py-2 text-right">消費税</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 16px; text-align: right; font-size: 13px;">
      <p>小計（税抜）：${fmt(inv.subtotal)}</p>
      <p>消費税額：${fmt(inv.taxTotal)}</p>
      <p style="font-size: 16px; font-weight: bold;">合計（税込）：${fmt(inv.total)}</p>
    </div>
    ${company.bankName ? `<div style="margin-top: 24px; font-size: 12px;"><strong>振込先</strong> ${escapeHtml(company.bankName)} ${company.accountType || ""} ${company.accountNumber || ""}  ${escapeHtml(company.accountHolder || "")}</div>` : ""}
    <div style="margin-top: 32px; text-align: right; font-size: 14px; font-weight: bold;">${escapeHtml(company.name)}</div>
  </div>`;
}

/** 様式4-2：請求内訳書（称規・格数・量・単位・単価・金額・支給区分・摘要） */
function buildYoshiki42Html(inv: Invoice, company: CompanyInfo): string {
  const rows = inv.items
    .map(
      (i) => `
    <tr>
      <td class="border px-2 py-1 text-sm">${escapeHtml(i.description)}</td>
      <td class="border px-2 py-1 text-sm text-right">${i.quantity.toLocaleString()}</td>
      <td class="border px-2 py-1 text-sm text-right">${i.quantity.toLocaleString()}</td>
      <td class="border px-2 py-1 text-sm text-center">${i.unit}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.unitPrice)}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.amount)}</td>
      <td class="border px-2 py-1 text-sm"></td>
      <td class="border px-2 py-1 text-sm"></td>
    </tr>`
    )
    .join("");
  return `
  <div class="invoice-pdf yoshiki42" style="font-family: 'Hiragino Sans','Meiryo',sans-serif; padding: 24px; max-width: 210mm;">
    <p style="font-size: 11px; margin-bottom: 4px;">（様式4-2）</p>
    <p style="font-size: 13px;">工事名　${escapeHtml(inv.projectName)}</p>
    <h1 style="font-size: 18px; text-align: center; margin: 16px 0;">請 求 内 訳 書</h1>
    <table class="w-full" style="border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-2 text-left">称規</th>
          <th class="border px-2 py-2 text-right">格数</th>
          <th class="border px-2 py-2 text-right">量</th>
          <th class="border px-2 py-2 text-center">単位</th>
          <th class="border px-2 py-2 text-right">単価</th>
          <th class="border px-2 py-2 text-right">金額</th>
          <th class="border px-2 py-2 text-left">支給区分</th>
          <th class="border px-2 py-2 text-left">摘要</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 8px; display: flex; font-size: 12px;">
      <span class="font-bold">合</span>
      <span style="margin-left: 24px; flex: 1; text-align: right;" class="font-bold">計　${fmt(inv.total)}</span>
    </div>
    <div style="margin-top: 24px; text-align: right; font-size: 13px;">${escapeHtml(company.name)}</div>
  </div>`;
}

/** 外注用請求書（月日・名称・数量・単位・単価・税抜金額・消費税率/額・費目・税込金額・税区分） */
function buildGaichuHtml(inv: Invoice, company: CompanyInfo): string {
  const rows = inv.items
    .map(
      (i) => `
    <tr>
      <td class="border px-2 py-1 text-sm">${i.date}</td>
      <td class="border px-2 py-1 text-sm">${escapeHtml(i.description)}</td>
      <td class="border px-2 py-1 text-sm text-right">${i.quantity.toLocaleString()}</td>
      <td class="border px-2 py-1 text-sm text-center">${i.unit}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.unitPrice)}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.amount)}</td>
      <td class="border px-2 py-1 text-sm text-center">${i.taxRate}%</td>
      <td class="border px-2 py-1 text-sm"></td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.amount + i.tax)}</td>
      <td class="border px-2 py-1 text-sm">${i.taxCategory ? TAX_CATEGORY_LABELS[i.taxCategory] : ""}</td>
    </tr>`
    )
    .join("");
  return `
  <div class="invoice-pdf gaichu" style="font-family: 'Hiragino Sans','Meiryo',sans-serif; padding: 24px; max-width: 210mm;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <p style="font-size: 14px; font-weight: bold;">${escapeHtml(inv.client)} 御中</p>
        <p style="font-size: 12px;">当月請求金額　${fmt(inv.total)}</p>
        <p style="font-size: 12px;">本体価格　${fmt(inv.subtotal)}　消費税額　${fmt(inv.taxTotal)}</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 18px;">請求書</h1>
        <p style="font-size: 11px;">（外注用）</p>
        <p style="font-size: 11px;">取引先コード ${escapeHtml(inv.clientCode)}</p>
        <p style="font-size: 11px;">課税事業者登録番号 ${escapeHtml(company.registrationNumber)}</p>
        <p style="font-size: 11px;">${escapeHtml(company.address)}</p>
        <p style="font-size: 12px; font-weight: bold;">${escapeHtml(company.name)}</p>
        <p style="font-size: 11px;">${escapeHtml(company.representative)}</p>
        <p style="font-size: 11px;">${escapeHtml(company.tel)}</p>
        ${company.bankName ? `<p style="font-size: 11px;">振込先 ${escapeHtml(company.bankName)} ${company.accountType || ""} ${company.accountNumber || ""}</p><p style="font-size: 10px;">${escapeHtml(company.accountHolder || "")}</p>` : ""}
      </div>
    </div>
    <div style="margin: 16px 0; font-size: 12px;">
      <p>工事名称　${escapeHtml(inv.projectName)}</p>
      <p>施工場所　</p>
      <p>個別外注注文番号　</p>
    </div>
    <table class="w-full" style="border-collapse: collapse; font-size: 10px;">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-1 py-2">月日</th>
          <th class="border px-1 py-2">名称</th>
          <th class="border px-1 py-2 text-right">数量</th>
          <th class="border px-1 py-2 text-center">単位</th>
          <th class="border px-1 py-2 text-right">単価</th>
          <th class="border px-1 py-2 text-right">税抜金額</th>
          <th class="border px-1 py-2 text-center">消費税率/額</th>
          <th class="border px-1 py-2">費目</th>
          <th class="border px-1 py-2 text-right">税込金額</th>
          <th class="border px-1 py-2">税区分</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 8px; font-size: 11px;">
      <p>課税対象外　0</p>
      <p>8%対象　0</p>
      <p>10%対象　${fmt(inv.subtotal)}</p>
      <p><strong>請求額計　${fmt(inv.total)}</strong></p>
    </div>
    <div style="margin-top: 16px; text-align: right; font-size: 12px;">所長</div>
  </div>`;
}

/** 提出用請求書（月日・摘要・単位・数量・単価・金額・検収・区分欄） */
function buildTeishutsuHtml(inv: Invoice, company: CompanyInfo): string {
  const rows = inv.items
    .map(
      (i) => `
    <tr>
      <td class="border px-2 py-1 text-sm">${i.date}</td>
      <td class="border px-2 py-1 text-sm">${escapeHtml(i.description)}</td>
      <td class="border px-2 py-1 text-sm text-center">${i.unit}</td>
      <td class="border px-2 py-1 text-sm text-right">${i.quantity.toLocaleString()}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.unitPrice)}</td>
      <td class="border px-2 py-1 text-sm text-right">${fmt(i.amount)}</td>
      <td class="border px-2 py-1 text-sm"></td>
    </tr>`
    )
    .join("");
  return `
  <div class="invoice-pdf teishutsu" style="font-family: 'Hiragino Sans','Meiryo',sans-serif; padding: 24px; max-width: 210mm;">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <h1 style="font-size: 20px;">請求書</h1>
        <p style="font-size: 13px;">${escapeHtml(inv.client)} 御中</p>
        <p style="font-size: 12px;">工事名　${escapeHtml(inv.projectName)}</p>
        <p style="font-size: 12px;">工事番号　${escapeHtml(inv.clientCode)}</p>
        <p style="font-size: 12px;">納入年月　${inv.issueDate}</p>
        <p style="font-size: 12px;">提出日　${inv.issueDate}</p>
      </div>
      <div style="text-align: right; font-size: 11px;">
        <p>取引先コード ${escapeHtml(inv.clientCode)}</p>
        <p>インボイス登録番号 ${escapeHtml(company.registrationNumber)}</p>
        <p>${escapeHtml(company.address)}</p>
        <p style="font-weight: bold;">${escapeHtml(company.name)}</p>
        <p>${escapeHtml(company.representative)}</p>
        <p>${escapeHtml(company.tel)}　${escapeHtml(company.fax)}</p>
        ${company.bankName ? `<p>振込先　${escapeHtml(company.bankName)} ${company.accountType || ""} 口座番号 ${company.accountNumber || ""}</p>` : ""}
      </div>
    </div>
    <div style="margin: 16px 0; font-size: 12px;">
      <p>前月までの契約額　${fmt(inv.subtotal)}　当月変更額　0　契約額合計　${fmt(inv.subtotal)}</p>
      <p>消費税額　${fmt(inv.taxTotal)}　消費税率　10%　総請求額　${fmt(inv.total)}</p>
    </div>
    <table class="w-full" style="border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-2">月日</th>
          <th class="border px-2 py-2 text-left">摘要（工種名・品名・規格）</th>
          <th class="border px-2 py-2 text-center">単位</th>
          <th class="border px-2 py-2 text-right">数量</th>
          <th class="border px-2 py-2 text-right">単価</th>
          <th class="border px-2 py-2 text-right">金額</th>
          <th class="border px-2 py-2">検収・区分欄</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 12px; font-size: 13px;">
      <p>小計　${fmt(inv.subtotal)}</p>
      <p><strong>今回請求額（本体金額）　${fmt(inv.subtotal)}</strong></p>
    </div>
    <div style="margin-top: 24px; text-align: right; font-size: 14px; font-weight: bold;">${escapeHtml(company.name)}</div>
  </div>`;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

export function getInvoicePdfHtml(
  inv: Invoice,
  company: CompanyInfo,
  formatName?: string
): string {
  const name = (formatName || "").toLowerCase();
  if (name.includes("様式4-2") || name.includes("請求内訳書")) return buildYoshiki42Html(inv, company);
  if (name.includes("外注用")) return buildGaichuHtml(inv, company);
  if (name.includes("提出用") || name.includes("提出")) return buildTeishutsuHtml(inv, company);
  return buildJishaHtml(inv, company);
}

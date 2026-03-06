import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Invoice } from "@/types/construction";
import type { CompanyInfo } from "./companyInfo";
import { getInvoicePdfHtml } from "./invoicePdfTemplate";

const CONTAINER_ID = "invoice-pdf-export-container";

/**
 * 請求書をPDFで出力する。書式（自社/様式4-2/外注用/提出用）に合わせたレイアウトで生成する。
 */
export async function exportInvoiceToPdf(
  invoice: Invoice,
  company: CompanyInfo,
  formatName?: string
): Promise<void> {
  const html = getInvoicePdfHtml(invoice, company, formatName);
  let container = document.getElementById(CONTAINER_ID) as HTMLElement | null;
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "210mm";
    container.style.background = "white";
    container.style.padding = "0";
    document.body.appendChild(container);
  }
  container.innerHTML = html;

  const element = container.firstElementChild as HTMLElement;
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * pageW) / canvas.width;

  if (imgH <= pageH) {
    pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
  } else {
    const scale = pageH / imgH;
    pdf.addImage(imgData, "PNG", 0, 0, imgW * scale, pageH);
  }

  const safeName = (invoice.invoiceNumber || "invoice").replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff-]/g, "_");
  pdf.save(`${safeName}.pdf`);

  container.innerHTML = "";
}

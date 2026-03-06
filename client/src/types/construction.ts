export type WorkflowStatus = 
  | "estimate_draft"
  | "estimate_submitted"
  | "recording"
  | "record_complete"
  | "invoice_draft"
  | "invoice_ready"
  | "submitted"
  | "resubmitted"
  | "cost_pending"
  | "cost_complete";

/** 税区分（インボイス・原価管理用） */
export type TaxCategoryCode =
  | "000"  // 対象外
  | "200"  // 課税仕入10%外税
  | "210"  // 課税仕入10%内税
  | "300"  // 課税仕入8%(軽減)外税
  | "310"  // 課税仕入8%(軽減)内税
  | "150"  // 課税仕入8%外税
  | "161"; // 課税仕入8%内税

export const TAX_CATEGORY_LABELS: Record<TaxCategoryCode, string> = {
  "000": "対象外",
  "200": "課税仕入10%外税",
  "210": "課税仕入10%内税",
  "300": "課税仕入8%(軽減)外税",
  "310": "課税仕入8%(軽減)内税",
  "150": "課税仕入8%外税",
  "161": "課税仕入8%内税",
};

export interface LineItem {
  id: string;
  date: string;
  /** 摘要・工種名・品名・規格の統合表示用（従来の description 互換） */
  description: string;
  /** 工種名（建設業の内訳用） */
  workTypeName?: string;
  /** 品名 */
  productName?: string;
  /** 規格 */
  spec?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  taxRate: number;
  tax: number;
  /** 税区分（元請書式・原価管理用） */
  taxCategory?: TaxCategoryCode;
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  client: string;
  clientCode: string;
  status: WorkflowStatus;
  estimateDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string;
}

export interface ConstructionRecord {
  id: string;
  projectId: string;
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
  remarks: string;
  taxCategory?: TaxCategoryCode;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  client: string;
  clientCode: string;
  format: "自社書式" | "元請書式";
  /** 元請書式の場合、使用した書式テンプレートID */
  clientFormatId?: string;
  status: "draft" | "ready" | "submitted" | "resubmitted";
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface Submission {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  projectName: string;
  client: string;
  submittedDate: string;
  status: "pending" | "accepted" | "rejected" | "resubmit_required";
  notes: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  date: string;
}

export interface ClientFormat {
  id: string;
  clientName: string;
  clientCode: string;
  formatName: string;
  fields: string[];
}

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  estimate_draft: "見積作成中",
  estimate_submitted: "見積提出済",
  recording: "施工中",
  record_complete: "施工完了",
  invoice_draft: "請求書作成中",
  invoice_ready: "請求書完成",
  submitted: "提出済",
  resubmitted: "再提出済",
  cost_pending: "原価確認中",
  cost_complete: "原価確定",
};

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
  estimate_draft: "bg-info/15 text-info",
  estimate_submitted: "bg-info/25 text-info",
  recording: "bg-warning/15 text-warning",
  record_complete: "bg-warning/25 text-warning",
  invoice_draft: "bg-status-invoice/15 text-status-invoice",
  invoice_ready: "bg-status-invoice/25 text-status-invoice",
  submitted: "bg-success/15 text-success",
  resubmitted: "bg-success/25 text-success",
  cost_pending: "bg-primary/15 text-primary",
  cost_complete: "bg-primary/25 text-primary",
};

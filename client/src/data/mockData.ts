import { Project, ConstructionRecord, Invoice, Submission, CostEntry, ClientFormat } from "@/types/construction";

export const mockProjects: Project[] = [
  {
    id: "1",
    projectNumber: "KJ-2025-001",
    name: "国道16号線 舗装補修工事",
    client: "ワールド開発工業(株)",
    clientCode: "040590",
    status: "recording",
    estimateDate: "2025/02/01",
    dueDate: "2025/03/15",
    items: [
      { id: "1-1", date: "2025/02/01", description: "アスファルト舗装 t=50", workTypeName: "舗装工事", productName: "アスファルト舗装", spec: "t=50", quantity: 500, unit: "㎡", unitPrice: 3500, amount: 1750000, taxRate: 10, tax: 175000, taxCategory: "210" },
      { id: "1-2", date: "2025/02/01", description: "路盤工 t=150", workTypeName: "路盤工", productName: "路盤", spec: "t=150", quantity: 500, unit: "㎡", unitPrice: 2800, amount: 1400000, taxRate: 10, tax: 140000, taxCategory: "210" },
      { id: "1-3", date: "2025/02/01", description: "区画線工", workTypeName: "区画線工", quantity: 200, unit: "m", unitPrice: 650, amount: 130000, taxRate: 10, tax: 13000, taxCategory: "210" },
    ],
    subtotal: 3280000,
    taxTotal: 328000,
    total: 3608000,
    notes: "",
  },
  {
    id: "2",
    projectNumber: "KJ-2025-002",
    name: "○○ショッピングモール駐車場舗装",
    client: "大成建設(株)",
    clientCode: "051020",
    status: "invoice_draft",
    estimateDate: "2025/01/15",
    dueDate: "2025/03/20",
    items: [
      { id: "2-1", date: "2025/01/15", description: "アスファルト舗装 t=40", quantity: 2000, unit: "㎡", unitPrice: 3200, amount: 6400000, taxRate: 10, tax: 640000 },
      { id: "2-2", date: "2025/01/15", description: "カラー舗装", quantity: 300, unit: "㎡", unitPrice: 5500, amount: 1650000, taxRate: 10, tax: 165000 },
    ],
    subtotal: 8050000,
    taxTotal: 805000,
    total: 8855000,
    notes: "",
  },
  {
    id: "3",
    projectNumber: "KJ-2025-003",
    name: "市道△△線 道路改良工事",
    client: "清水建設(株)",
    clientCode: "030870",
    status: "estimate_submitted",
    estimateDate: "2025/02/20",
    dueDate: "2025/02/28",
    items: [
      { id: "3-1", date: "2025/02/20", description: "舗装版切断工", quantity: 150, unit: "m", unitPrice: 800, amount: 120000, taxRate: 10, tax: 12000 },
      { id: "3-2", date: "2025/02/20", description: "舗装版破砕工", quantity: 300, unit: "㎡", unitPrice: 1200, amount: 360000, taxRate: 10, tax: 36000 },
      { id: "3-3", date: "2025/02/20", description: "アスファルト舗装 t=50", quantity: 300, unit: "㎡", unitPrice: 3500, amount: 1050000, taxRate: 10, tax: 105000 },
    ],
    subtotal: 1530000,
    taxTotal: 153000,
    total: 1683000,
    notes: "",
  },
  {
    id: "4",
    projectNumber: "KJ-2025-004",
    name: "工業団地内 構内舗装工事",
    client: "鹿島建設(株)",
    clientCode: "020450",
    status: "submitted",
    estimateDate: "2025/01/10",
    dueDate: "2025/03/10",
    items: [
      { id: "4-1", date: "2025/01/10", description: "コンクリート舗装 t=200", quantity: 800, unit: "㎡", unitPrice: 6500, amount: 5200000, taxRate: 10, tax: 520000 },
      { id: "4-2", date: "2025/01/10", description: "目地工", quantity: 400, unit: "m", unitPrice: 450, amount: 180000, taxRate: 10, tax: 18000 },
    ],
    subtotal: 5380000,
    taxTotal: 538000,
    total: 5918000,
    notes: "",
  },
  {
    id: "5",
    projectNumber: "KJ-2025-005",
    name: "県道○号線 オーバーレイ工事",
    client: "大林組(株)",
    clientCode: "010320",
    status: "cost_complete",
    estimateDate: "2024/12/01",
    dueDate: "2025/01/31",
    items: [
      { id: "5-1", date: "2024/12/01", description: "オーバーレイ t=30", quantity: 1000, unit: "㎡", unitPrice: 2500, amount: 2500000, taxRate: 10, tax: 250000 },
    ],
    subtotal: 2500000,
    taxTotal: 250000,
    total: 2750000,
    notes: "",
  },
];

export const mockRecords: ConstructionRecord[] = [
  { id: "r1", projectId: "1", projectName: "国道16号線 舗装補修工事", date: "2025/03/01", description: "アスファルト舗装 t=50", quantity: 120, unit: "㎡", unitPrice: 3500, amount: 420000, remarks: "1工区完了" },
  { id: "r2", projectId: "1", projectName: "国道16号線 舗装補修工事", date: "2025/03/02", description: "路盤工 t=150", quantity: 80, unit: "㎡", unitPrice: 2800, amount: 224000, remarks: "2工区着手" },
  { id: "r3", projectId: "1", projectName: "国道16号線 舗装補修工事", date: "2025/03/03", description: "アスファルト舗装 t=50", quantity: 150, unit: "㎡", unitPrice: 3500, amount: 525000, remarks: "" },
  { id: "r4", projectId: "2", projectName: "○○ショッピングモール駐車場舗装", date: "2025/02/28", description: "アスファルト舗装 t=40", quantity: 600, unit: "㎡", unitPrice: 3200, amount: 1920000, remarks: "A区画完了" },
  { id: "r5", projectId: "2", projectName: "○○ショッピングモール駐車場舗装", date: "2025/03/01", description: "カラー舗装", quantity: 100, unit: "㎡", unitPrice: 5500, amount: 550000, remarks: "" },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2025-001",
    projectId: "4",
    projectName: "工業団地内 構内舗装工事",
    client: "鹿島建設(株)",
    clientCode: "020450",
    format: "自社書式",
    status: "submitted",
    issueDate: "2025/03/05",
    dueDate: "2025/03/31",
    items: [
      { id: "i1-1", date: "2025/03/05", description: "コンクリート舗装 t=200", quantity: 800, unit: "㎡", unitPrice: 6500, amount: 5200000, taxRate: 10, tax: 520000 },
      { id: "i1-2", date: "2025/03/05", description: "目地工", quantity: 400, unit: "m", unitPrice: 450, amount: 180000, taxRate: 10, tax: 18000 },
    ],
    subtotal: 5380000,
    taxTotal: 538000,
    total: 5918000,
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2025-002",
    projectId: "5",
    projectName: "県道○号線 オーバーレイ工事",
    client: "大林組(株)",
    clientCode: "010320",
    format: "元請書式",
    status: "submitted",
    issueDate: "2025/01/25",
    dueDate: "2025/02/28",
    items: [
      { id: "i2-1", date: "2025/01/25", description: "オーバーレイ t=30", workTypeName: "舗装工事", productName: "オーバーレイ", spec: "t=30", quantity: 1000, unit: "㎡", unitPrice: 2500, amount: 2500000, taxRate: 10, tax: 250000, taxCategory: "210" },
    ],
    subtotal: 2500000,
    taxTotal: 250000,
    total: 2750000,
    clientFormatId: "cf4",
  },
];

export const mockSubmissions: Submission[] = [
  { id: "s1", invoiceId: "inv1", invoiceNumber: "INV-2025-001", projectName: "工業団地内 構内舗装工事", client: "鹿島建設(株)", submittedDate: "2025/03/06", status: "accepted", notes: "受理済み" },
  { id: "s2", invoiceId: "inv2", invoiceNumber: "INV-2025-002", projectName: "県道○号線 オーバーレイ工事", client: "大林組(株)", submittedDate: "2025/01/26", status: "resubmit_required", notes: "元請書式での再提出が必要" },
];

export const mockCosts: CostEntry[] = [
  { id: "c1", projectId: "5", projectName: "県道○号線 オーバーレイ工事", category: "材料費", description: "アスファルト合材", budgetAmount: 1200000, actualAmount: 1150000, difference: 50000, date: "2025/01/15" },
  { id: "c2", projectId: "5", projectName: "県道○号線 オーバーレイ工事", category: "労務費", description: "舗装作業員", budgetAmount: 800000, actualAmount: 820000, difference: -20000, date: "2025/01/20" },
  { id: "c3", projectId: "5", projectName: "県道○号線 オーバーレイ工事", category: "機械費", description: "フィニッシャー・ローラー", budgetAmount: 350000, actualAmount: 340000, difference: 10000, date: "2025/01/18" },
  { id: "c4", projectId: "4", projectName: "工業団地内 構内舗装工事", category: "材料費", description: "コンクリート", budgetAmount: 2800000, actualAmount: 2950000, difference: -150000, date: "2025/02/20" },
  { id: "c5", projectId: "4", projectName: "工業団地内 構内舗装工事", category: "労務費", description: "コンクリート作業員", budgetAmount: 1500000, actualAmount: 1480000, difference: 20000, date: "2025/02/25" },
];

export const mockClientFormats: ClientFormat[] = [
  { id: "cf1", clientName: "ワールド開発工業(株)", clientCode: "040590", formatName: "請求書(合計表)", fields: ["日付", "工事名・品名等", "数量", "単位", "単価", "請求額", "消費税率"] },
  { id: "cf2", clientName: "大成建設(株)", clientCode: "051020", formatName: "請求内訳明細書", fields: ["日付", "工事名・品名等", "数量", "単位", "単価", "金額", "備考"] },
  { id: "cf3", clientName: "清水建設(株)", clientCode: "030870", formatName: "各種明細・領収書", fields: ["日付", "税合計", "小計", "購買税"] },
  { id: "cf4", clientName: "大林組(株)", clientCode: "010320", formatName: "外注用請求書(様式)", fields: ["月日", "名称", "数量", "単位", "単価", "税抜金額", "消費税率/額", "費目", "税込金額", "税区分"] },
  { id: "cf5", clientName: "大林組(株)", clientCode: "010320", formatName: "請求内訳書(様式4-2)", fields: ["称規", "格数", "量", "単位", "単価", "金額", "支給区分", "摘要"] },
];

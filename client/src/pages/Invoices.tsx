import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoicesApi, projectsApi, clientFormatsApi } from "@/lib/api";
import { type Invoice, TAX_CATEGORY_LABELS } from "@/types/construction";
import { Plus, Search, FileText, FileSpreadsheet } from "lucide-react";
import { defaultCompanyInfo } from "@/lib/companyInfo";
import { exportInvoiceToPdf } from "@/lib/exportInvoicePdf";
import { exportInvoiceToExcel } from "@/lib/exportInvoiceExcel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  ready: "完成",
  submitted: "提出済",
  resubmitted: "再提出済",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-info/15 text-info",
  submitted: "bg-success/15 text-success",
  resubmitted: "bg-warning/15 text-warning",
};

const Invoices = () => {
  const queryClient = useQueryClient();
  const { data: invoicesData, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => invoicesApi.list() });
  const { data: projectsData } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });
  const { data: clientFormatsData } = useQuery({ queryKey: ["clientFormats"], queryFn: () => clientFormatsApi.list() });
  const invoices = invoicesData?.invoices ?? [];
  const mockProjects = projectsData?.projects ?? [];
  const mockClientFormats = clientFormatsData?.clientFormats ?? [];

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("請求書を作成しました");
      setShowCreate(false);
      setSelectedProjectId("");
      setSelectedClientFormatId("");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"自社書式" | "元請書式">("自社書式");
  const [selectedClientFormatId, setSelectedClientFormatId] = useState("");

  const filtered = invoices.filter(
    (inv) => inv.projectName.includes(search) || inv.client.includes(search) || inv.invoiceNumber.includes(search)
  );

  const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;

  const getFormatName = (inv: Invoice) =>
    inv.clientFormatId ? mockClientFormats.find((cf) => cf.id === inv.clientFormatId)?.formatName : undefined;

  const handleExportPdf = async (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    try {
      await exportInvoiceToPdf(inv, defaultCompanyInfo, getFormatName(inv));
      toast.success("PDFをダウンロードしました");
    } catch (err) {
      toast.error("PDFの出力に失敗しました");
    }
  };

  const handleExportExcel = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    try {
      exportInvoiceToExcel(inv, defaultCompanyInfo, getFormatName(inv));
      toast.success("Excelをダウンロードしました");
    } catch (err) {
      toast.error("Excelの出力に失敗しました");
    }
  };

  const selectedProject = selectedProjectId ? mockProjects.find((p) => p.id === selectedProjectId) : null;
  const clientFormatsForProject = selectedProject
    ? mockClientFormats.filter((cf) => cf.clientCode === selectedProject.clientCode)
    : [];
  const selectedClientFormat = selectedClientFormatId
    ? mockClientFormats.find((cf) => cf.id === selectedClientFormatId)
    : clientFormatsForProject[0] ?? null;

  const handleCreate = () => {
    const project = mockProjects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    createMutation.mutate({
      projectId: project.id,
      projectName: project.name,
      client: project.client,
      clientCode: project.clientCode,
      format: selectedFormat,
      clientFormatId: selectedFormat === "元請書式" ? (selectedClientFormatId || clientFormatsForProject[0]?.id) || undefined : undefined,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: project.dueDate,
      items: project.items,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8"><p className="text-muted-foreground">読み込み中...</p></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">請求書作成</h1>
            <p className="text-sm text-muted-foreground mt-1">自社書式・元請書式での請求書作成</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            請求書作成
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="請求書番号・工事名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">請求書番号</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">工事名</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">元請</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">書式</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ステータス</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">請求金額</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">発行日</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                  <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{inv.invoiceNumber}</td>
                  <td className="px-5 py-4 text-sm font-medium text-card-foreground">{inv.projectName}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{inv.client}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${inv.format === "自社書式" ? "bg-secondary text-secondary-foreground" : "bg-info/15 text-info"}`}>
                      {inv.format}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${INVOICE_STATUS_COLORS[inv.status]}`}>
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-card-foreground text-right">{formatCurrency(inv.total)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground text-right">{inv.issueDate}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => handleExportPdf(e, inv)} title="PDF出力">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleExportExcel(e, inv)} title="Excel出力">
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>請求書作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>案件を選択</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="案件を選択" /></SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>書式</Label>
                <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="自社書式" className="flex-1">自社書式</TabsTrigger>
                    <TabsTrigger value="元請書式" className="flex-1">元請書式</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {selectedFormat === "元請書式" && clientFormatsForProject.length > 0 && (
                <div className="space-y-2">
                  <Label>使用する書式</Label>
                  <Select value={selectedClientFormatId || clientFormatsForProject[0]?.id} onValueChange={setSelectedClientFormatId}>
                    <SelectTrigger><SelectValue placeholder="書式を選択" /></SelectTrigger>
                    <SelectContent>
                      {clientFormatsForProject.map((cf) => (
                        <SelectItem key={cf.id} value={cf.id}>{cf.formatName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedClientFormat ?? clientFormatsForProject[0]) && (
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">対応フィールド: {(selectedClientFormat ?? clientFormatsForProject[0]).fields.join(", ")}</p>
                    </div>
                  )}
                </div>
              )}
              {selectedProjectId && (
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">見積からの自動取込</p>
                  <p className="text-lg font-bold text-card-foreground mt-1">
                    {formatCurrency(mockProjects.find((p) => p.id === selectedProjectId)?.total || 0)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button onClick={handleCreate} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedProjectId || createMutation.isPending}>作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {selectedInvoice && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      {selectedInvoice.invoiceNumber}
                      <span className={`text-xs px-2 py-1 rounded-full ${INVOICE_STATUS_COLORS[selectedInvoice.status]}`}>
                        {INVOICE_STATUS_LABELS[selectedInvoice.status]}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={(e) => { handleExportPdf(e, selectedInvoice); }} className="gap-1">
                        <FileText className="w-4 h-4" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { handleExportExcel(e, selectedInvoice); }} className="gap-1">
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">工事名:</span> <span className="font-medium">{selectedInvoice.projectName}</span></div>
                    <div><span className="text-muted-foreground">元請:</span> <span className="font-medium">{selectedInvoice.client}</span></div>
                    <div><span className="text-muted-foreground">書式:</span> <span>{selectedInvoice.format}{selectedInvoice.clientFormatId ? `（${mockClientFormats.find((cf) => cf.id === selectedInvoice.clientFormatId)?.formatName ?? "—"}）` : ""}</span></div>
                    <div><span className="text-muted-foreground">期日:</span> <span>{selectedInvoice.dueDate}</span></div>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-left text-xs px-4 py-2 text-muted-foreground">工事名・品名・規格</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">数量</th>
                          <th className="text-center text-xs px-4 py-2 text-muted-foreground">単位</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">単価</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">金額</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">消費税</th>
                          {selectedInvoice.items.some((i) => i.taxCategory) && (
                            <th className="text-left text-xs px-4 py-2 text-muted-foreground">税区分</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 text-sm">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.tax)}</td>
                            {selectedInvoice.items.some((i) => i.taxCategory) && (
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {item.taxCategory ? TAX_CATEGORY_LABELS[item.taxCategory] : "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">小計: {formatCurrency(selectedInvoice.subtotal)}</p>
                    <p className="text-sm text-muted-foreground">消費税: {formatCurrency(selectedInvoice.taxTotal)}</p>
                    <p className="text-lg font-bold">合計: {formatCurrency(selectedInvoice.total)}</p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Invoices;

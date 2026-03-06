import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submissionsApi, invoicesApi } from "@/lib/api";
import { type Submission } from "@/types/construction";
import { Search, Send, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "確認中", color: "bg-warning/15 text-warning", icon: Clock },
  accepted: { label: "受理済", color: "bg-success/15 text-success", icon: CheckCircle2 },
  rejected: { label: "差戻し", color: "bg-destructive/15 text-destructive", icon: XCircle },
  resubmit_required: { label: "再提出要", color: "bg-warning/15 text-warning", icon: AlertTriangle },
};

const Submissions = () => {
  const queryClient = useQueryClient();
  const { data: submissionsData, isLoading } = useQuery({ queryKey: ["submissions"], queryFn: () => submissionsApi.list() });
  const { data: invoicesData } = useQuery({ queryKey: ["invoices"], queryFn: () => invoicesApi.list() });
  const submissions = submissionsData?.submissions ?? [];
  const mockInvoices = invoicesData?.invoices ?? [];

  const createMutation = useMutation({
    mutationFn: submissionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("請求書を提出しました");
      setShowSubmit(false);
      setSelectedInvoiceId("");
      setSubmitNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Submission["status"] }) => submissionsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("ステータスを更新しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");

  const filtered = submissions.filter(
    (s) => s.projectName.includes(search) || s.invoiceNumber.includes(search) || s.client.includes(search)
  );

  const handleSubmit = () => {
    const inv = mockInvoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;
    createMutation.mutate({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      projectName: inv.projectName,
      client: inv.client,
      submittedDate: new Date().toISOString().slice(0, 10),
      status: "pending",
      notes: submitNotes,
    });
  };

  const updateStatus = (id: string, status: Submission["status"]) => {
    updateMutation.mutate({ id, status });
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
            <h1 className="text-2xl font-bold text-foreground">提出管理</h1>
            <p className="text-sm text-muted-foreground mt-1">請求書の提出状況を管理</p>
          </div>
          <Button onClick={() => setShowSubmit(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Send className="w-4 h-4 mr-2" />
            提出する
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="請求書番号・工事名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="grid gap-4">
          {filtered.map((sub) => {
            const config = STATUS_CONFIG[sub.status];
            const Icon = config.icon;
            return (
              <div key={sub.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-muted-foreground">{sub.invoiceNumber}</p>
                      <p className="text-base font-semibold text-card-foreground mt-0.5">{sub.projectName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{sub.client}</p>
                      {sub.notes && <p className="text-sm text-muted-foreground mt-2 bg-muted rounded-lg px-3 py-2">{sub.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                    <p className="text-xs text-muted-foreground">{sub.submittedDate}</p>
                    {sub.status === "resubmit_required" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(sub.id, "pending")} className="text-xs">
                        再提出
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>請求書提出</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>請求書を選択</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger><SelectValue placeholder="請求書を選択" /></SelectTrigger>
                  <SelectContent>
                    {mockInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.projectName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>備考</Label>
                <Textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="提出時のメモ" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmit(false)}>キャンセル</Button>
              <Button onClick={handleSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedInvoiceId || createMutation.isPending}>提出</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Submissions;

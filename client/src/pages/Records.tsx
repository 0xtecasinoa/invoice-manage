import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordsApi, projectsApi } from "@/lib/api";
import { type ConstructionRecord } from "@/types/construction";
import { Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Records = () => {
  const queryClient = useQueryClient();
  const { data: recordsData, isLoading } = useQuery({ queryKey: ["records"], queryFn: () => recordsApi.list() });
  const { data: projectsData } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });
  const records = recordsData?.records ?? [];
  const projects = projectsData?.projects ?? [];

  const createMutation = useMutation({
    mutationFn: recordsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      toast.success("施工実績を登録しました");
      setShowCreate(false);
      setNewRecord({ projectId: "", date: "", description: "", quantity: 0, unit: "㎡", unitPrice: 0, remarks: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: recordsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      toast.success("削除しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newRecord, setNewRecord] = useState({
    projectId: "",
    date: "",
    description: "",
    quantity: 0,
    unit: "㎡",
    unitPrice: 0,
    remarks: "",
  });

  const filtered = records.filter(
    (r) => r.projectName.includes(search) || r.description.includes(search)
  );

  const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;

  const handleCreate = () => {
    const project = projects.find((p) => p.id === newRecord.projectId);
    if (!project) return;
    createMutation.mutate({
      projectId: newRecord.projectId,
      projectName: project.name,
      date: newRecord.date,
      description: newRecord.description,
      quantity: newRecord.quantity,
      unit: newRecord.unit,
      unitPrice: newRecord.unitPrice,
      amount: newRecord.quantity * newRecord.unitPrice,
      remarks: newRecord.remarks,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Group by project
  const grouped = filtered.reduce<Record<string, ConstructionRecord[]>>((acc, r) => {
    if (!acc[r.projectName]) acc[r.projectName] = [];
    acc[r.projectName].push(r);
    return acc;
  }, {});

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
            <h1 className="text-2xl font-bold text-foreground">施工実績管理</h1>
            <p className="text-sm text-muted-foreground mt-1">日々の施工実績を記録・管理</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            実績登録
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="工事名・品名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([projectName, recs]) => (
            <div key={projectName} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-card-foreground">{projectName}</h3>
                <span className="text-sm font-medium text-accent">
                  合計: {formatCurrency(recs.reduce((sum, r) => sum + r.amount, 0))}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">日付</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">工事名・品名</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-2">数量</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-5 py-2">単位</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-2">単価</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-2">金額</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">備考</th>
                    <th className="px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-sm text-muted-foreground">{r.date}</td>
                      <td className="px-5 py-3 text-sm font-medium text-card-foreground">{r.description}</td>
                      <td className="px-5 py-3 text-sm text-right">{r.quantity.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-center">{r.unit}</td>
                      <td className="px-5 py-3 text-sm text-right">{formatCurrency(r.unitPrice)}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium">{formatCurrency(r.amount)}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{r.remarks}</td>
                      <td className="px-5 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>施工実績登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>案件</Label>
                <Select value={newRecord.projectId} onValueChange={(v) => setNewRecord({ ...newRecord, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="案件を選択" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>日付</Label>
                  <Input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} />
                </div>
                <div>
                  <Label>単位</Label>
                  <Input value={newRecord.unit} onChange={(e) => setNewRecord({ ...newRecord, unit: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>工事名・品名</Label>
                <Input value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>数量</Label>
                  <Input type="number" value={newRecord.quantity || ""} onChange={(e) => setNewRecord({ ...newRecord, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>単価</Label>
                  <Input type="number" value={newRecord.unitPrice || ""} onChange={(e) => setNewRecord({ ...newRecord, unitPrice: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>備考</Label>
                <Input value={newRecord.remarks} onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })} />
              </div>
              <div className="text-right text-lg font-bold">
                金額: {formatCurrency(newRecord.quantity * newRecord.unitPrice)}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">登録</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Records;

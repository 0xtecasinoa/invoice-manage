import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsApi } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, type Project, type LineItem } from "@/types/construction";
import { Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Estimates = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });
  const projects = data?.projects ?? [];
  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("見積書を作成しました");
      setShowCreate(false);
      setNewProject({ name: "", client: "", clientCode: "", dueDate: "" });
      setNewItems([{ date: "", description: "", quantity: 0, unit: "㎡", unitPrice: 0, taxRate: 10 }]);
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    clientCode: "",
    dueDate: "",
  });
  const [newItems, setNewItems] = useState<Omit<LineItem, "id" | "amount" | "tax">[]>([
    { date: "", description: "", quantity: 0, unit: "㎡", unitPrice: 0, taxRate: 10 },
  ]);

  const filtered = projects.filter(
    (p) =>
      p.name.includes(search) ||
      p.client.includes(search) ||
      p.projectNumber.includes(search)
  );

  const addItem = () => {
    setNewItems([...newItems, { date: "", description: "", quantity: 0, unit: "㎡", unitPrice: 0, taxRate: 10 }]);
  };

  const removeItem = (index: number) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...newItems];
    (updated[index] as any)[field] = value;
    setNewItems(updated);
  };

  const handleCreate = () => {
    const estimateDate = new Date().toISOString().slice(0, 10);
    const items = newItems.map((item) => {
      const amount = item.quantity * item.unitPrice;
      const tax = Math.floor(amount * (item.taxRate || 10) / 100);
      return {
        date: item.date || estimateDate,
        description: item.description || "",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount,
        taxRate: item.taxRate ?? 10,
        tax,
      };
    });
    createMutation.mutate({
      name: newProject.name,
      client: newProject.client,
      clientCode: newProject.clientCode,
      dueDate: newProject.dueDate,
      items,
      notes: "",
    });
  };

  const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">見積管理</h1>
            <p className="text-sm text-muted-foreground mt-1">見積書の作成・管理</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            新規見積
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="工事名・元請で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">案件番号</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">工事名</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">元請</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ステータス</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">見積金額</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">見積日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{project.projectNumber}</td>
                  <td className="px-5 py-4 text-sm font-medium text-card-foreground">{project.name}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{project.client}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-card-foreground text-right">{formatCurrency(project.total)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground text-right">{project.estimateDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規見積書作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>工事名</Label>
                  <Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="工事名を入力" />
                </div>
                <div>
                  <Label>元請会社</Label>
                  <Input value={newProject.client} onChange={(e) => setNewProject({ ...newProject, client: e.target.value })} placeholder="元請会社名" />
                </div>
                <div>
                  <Label>取引先コード</Label>
                  <Input value={newProject.clientCode} onChange={(e) => setNewProject({ ...newProject, clientCode: e.target.value })} placeholder="040590" />
                </div>
                <div>
                  <Label>期日</Label>
                  <Input type="date" value={newProject.dueDate} onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>明細項目</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-3 h-3 mr-1" />行追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {newItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Input placeholder="工事名・品名" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="数量" value={item.quantity || ""} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="col-span-1">
                        <Input placeholder="単位" value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="単価" value={item.unitPrice || ""} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 text-sm text-right font-medium text-card-foreground py-2">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={newItems.length === 1}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right text-lg font-bold text-card-foreground">
                  合計: {formatCurrency(newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (税込 {formatCurrency(Math.floor(newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice * 1.1, 0)))})
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span>{selectedProject.projectNumber}</span>
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[selectedProject.status]}`}>
                      {STATUS_LABELS[selectedProject.status]}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">工事名:</span> <span className="font-medium">{selectedProject.name}</span></div>
                    <div><span className="text-muted-foreground">元請:</span> <span className="font-medium">{selectedProject.client}</span></div>
                    <div><span className="text-muted-foreground">取引先コード:</span> <span className="font-mono">{selectedProject.clientCode}</span></div>
                    <div><span className="text-muted-foreground">期日:</span> <span>{selectedProject.dueDate}</span></div>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-left text-xs px-4 py-2 text-muted-foreground">工事名・品名</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">数量</th>
                          <th className="text-center text-xs px-4 py-2 text-muted-foreground">単位</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">単価</th>
                          <th className="text-right text-xs px-4 py-2 text-muted-foreground">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.items.map((item) => (
                          <tr key={item.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 text-sm">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">小計: {formatCurrency(selectedProject.subtotal)}</p>
                    <p className="text-sm text-muted-foreground">消費税: {formatCurrency(selectedProject.taxTotal)}</p>
                    <p className="text-lg font-bold">合計: {formatCurrency(selectedProject.total)}</p>
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

export default Estimates;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { costsApi, projectsApi } from "@/lib/api";
import { type CostEntry } from "@/types/construction";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Costs = () => {
  const queryClient = useQueryClient();
  const { data: costsData, isLoading } = useQuery({ queryKey: ["costs"], queryFn: () => costsApi.list() });
  const { data: projectsData } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });
  const costs = costsData?.costs ?? [];
  const mockProjects = projectsData?.projects ?? [];

  const createMutation = useMutation({
    mutationFn: costsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("原価データを登録しました");
      setShowCreate(false);
      setNewCost({ projectId: "", category: "材料費", description: "", budgetAmount: 0, actualAmount: 0, date: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newCost, setNewCost] = useState({
    projectId: "",
    category: "材料費",
    description: "",
    budgetAmount: 0,
    actualAmount: 0,
    date: "",
  });

  const filtered = costs.filter(
    (c) => c.projectName.includes(search) || c.description.includes(search) || c.category.includes(search)
  );

  const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;

  // Summary by project
  const projectSummary = Object.values(
    filtered.reduce<Record<string, { name: string; budget: number; actual: number }>>((acc, c) => {
      if (!acc[c.projectId]) acc[c.projectId] = { name: c.projectName, budget: 0, actual: 0 };
      acc[c.projectId].budget += c.budgetAmount;
      acc[c.projectId].actual += c.actualAmount;
      return acc;
    }, {})
  );

  const handleCreate = () => {
    const project = mockProjects.find((p) => p.id === newCost.projectId);
    if (!project) return;
    createMutation.mutate({
      projectId: newCost.projectId,
      projectName: project.name,
      category: newCost.category,
      description: newCost.description,
      budgetAmount: newCost.budgetAmount,
      actualAmount: newCost.actualAmount,
      date: newCost.date,
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
            <h1 className="text-2xl font-bold text-foreground">原価管理</h1>
            <p className="text-sm text-muted-foreground mt-1">案件別の予算と実績を管理</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            原価登録
          </Button>
        </div>

        {/* Project Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {projectSummary.map((ps) => {
            const diff = ps.budget - ps.actual;
            const isOver = diff < 0;
            return (
              <div key={ps.name} className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3 line-clamp-1">{ps.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">予算</span>
                    <span className="font-medium">{formatCurrency(ps.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">実績</span>
                    <span className="font-medium">{formatCurrency(ps.actual)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">差額</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${isOver ? "text-destructive" : "text-success"}`}>
                      {isOver ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      {formatCurrency(Math.abs(diff))} {isOver ? "超過" : "余裕"}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-success"}`}
                      style={{ width: `${Math.min((ps.actual / ps.budget) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {((ps.actual / ps.budget) * 100).toFixed(1)}% 消化
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="工事名・カテゴリで検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">工事名</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">カテゴリ</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">内容</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">予算</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">実績</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">差額</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">日付</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-card-foreground">{c.projectName}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{c.category}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{c.description}</td>
                  <td className="px-5 py-4 text-sm text-right">{formatCurrency(c.budgetAmount)}</td>
                  <td className="px-5 py-4 text-sm text-right">{formatCurrency(c.actualAmount)}</td>
                  <td className={`px-5 py-4 text-sm text-right font-medium ${c.difference >= 0 ? "text-success" : "text-destructive"}`}>
                    {c.difference >= 0 ? "+" : ""}{formatCurrency(c.difference)}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground text-right">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>原価データ登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>案件</Label>
                <Select value={newCost.projectId} onValueChange={(v) => setNewCost({ ...newCost, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="案件を選択" /></SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>カテゴリ</Label>
                  <Select value={newCost.category} onValueChange={(v) => setNewCost({ ...newCost, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="材料費">材料費</SelectItem>
                      <SelectItem value="労務費">労務費</SelectItem>
                      <SelectItem value="機械費">機械費</SelectItem>
                      <SelectItem value="外注費">外注費</SelectItem>
                      <SelectItem value="経費">経費</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>日付</Label>
                  <Input type="date" value={newCost.date} onChange={(e) => setNewCost({ ...newCost, date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>内容</Label>
                <Input value={newCost.description} onChange={(e) => setNewCost({ ...newCost, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>予算額</Label>
                  <Input type="number" value={newCost.budgetAmount || ""} onChange={(e) => setNewCost({ ...newCost, budgetAmount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>実績額</Label>
                  <Input type="number" value={newCost.actualAmount || ""} onChange={(e) => setNewCost({ ...newCost, actualAmount: Number(e.target.value) })} />
                </div>
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

export default Costs;

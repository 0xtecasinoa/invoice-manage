import { TrendingUp, FileText, Receipt, AlertTriangle } from "lucide-react";
import type { Project, Invoice, CostEntry } from "@/types/construction";

interface StatsCardsProps {
  projects: Project[];
  invoices: Invoice[];
  costs: CostEntry[];
}

function useStats(projects: Project[], invoices: Invoice[], costs: CostEntry[]) {
  const submittedThisMonth = invoices.filter(
    (inv) => inv.status === "submitted" || inv.status === "resubmitted"
  );
  const monthlyTotal = submittedThisMonth.reduce((sum, inv) => sum + inv.total, 0);
  const inProgress = projects.filter(
    (p) =>
      p.status !== "cost_complete" &&
      p.status !== "estimate_draft"
  ).length;
  const unpaidCount = invoices.filter(
    (inv) => inv.status === "draft" || inv.status === "ready"
  ).length;
  const overBudgetCount = costs.filter((c) => c.difference < 0).length;
  const overBudgetProjects = new Set(costs.filter((c) => c.difference < 0).map((c) => c.projectId)).size;

  return [
    {
      label: "今月の売上（提出済請求）",
      value: `¥${monthlyTotal.toLocaleString()}`,
      change: submittedThisMonth.length ? `${submittedThisMonth.length}件` : "—",
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "進行中案件",
      value: `${inProgress} 件`,
      change: "見積提出済〜原価確認中",
      icon: FileText,
      positive: true,
    },
    {
      label: "未提出請求書",
      value: `${unpaidCount} 件`,
      change: unpaidCount > 0 ? "要対応" : "なし",
      icon: Receipt,
      positive: false,
    },
    {
      label: "原価超過",
      value: `${overBudgetProjects} 件`,
      change: overBudgetCount > 0 ? "注意" : "なし",
      icon: AlertTriangle,
      positive: false,
    },
  ];
}

const StatsCards = ({ projects, invoices, costs }: StatsCardsProps) => {
  const stats = useStats(projects, invoices, costs);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.positive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {stat.change}
            </span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

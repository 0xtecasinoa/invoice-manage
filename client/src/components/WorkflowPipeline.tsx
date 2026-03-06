import { FileText, ClipboardList, Receipt, Send, Calculator, CheckCircle2 } from "lucide-react";
import type { Project, ConstructionRecord, Invoice, Submission, CostEntry } from "@/types/construction";

interface WorkflowPipelineProps {
  projects: Project[];
  records: ConstructionRecord[];
  invoices: Invoice[];
  submissions: Submission[];
  costs: CostEntry[];
}

function useWorkflowCounts(
  projects: Project[],
  records: ConstructionRecord[],
  invoices: Invoice[],
  submissions: Submission[],
  costs: CostEntry[]
) {
  const estimateCount = projects.filter(
    (p) => p.status === "estimate_draft" || p.status === "estimate_submitted"
  ).length;
  return {
    estimate: estimateCount,
    record: records.length,
    invoice: invoices.length,
    submitted: submissions.length,
    cost: costs.length,
  };
}

const statusColors: Record<string, string> = {
  estimate: "bg-status-estimate",
  record: "bg-status-record",
  invoice: "bg-status-invoice",
  submitted: "bg-status-submitted",
  cost: "bg-status-cost",
};

const steps = [
  { icon: FileText, label: "見積", status: "estimate" as const },
  { icon: ClipboardList, label: "施工実績", status: "record" as const },
  { icon: Receipt, label: "請求書", status: "invoice" as const },
  { icon: Send, label: "提出", status: "submitted" as const },
  { icon: Calculator, label: "原価管理", status: "cost" as const },
];

const WorkflowPipeline = ({ projects, records, invoices, submissions, costs }: WorkflowPipelineProps) => {
  const counts = useWorkflowCounts(projects, records, invoices, submissions, costs);
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-6">ワークフロー概況</h2>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-14 h-14 rounded-xl ${statusColors[step.status]} flex items-center justify-center mb-3 shadow-sm`}
              >
                <step.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-sm font-medium text-card-foreground">{step.label}</span>
              <span className="text-xs text-muted-foreground mt-1">{counts[step.status]} 件</span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex items-center px-2 -mt-6">
                <div className="w-8 h-0.5 bg-border" />
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 mx-1" />
                <div className="w-8 h-0.5 bg-border" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowPipeline;

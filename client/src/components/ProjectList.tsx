import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "@/types/construction";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/construction";

const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;

interface ProjectListProps {
  projects: Project[];
}

const ProjectList = ({ projects: projectsProp }: ProjectListProps) => {
  const projects = [...projectsProp].sort(
    (a, b) => new Date(b.estimateDate).getTime() - new Date(a.estimateDate).getTime()
  );
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">最近の案件</h2>
        <Link to="/estimates" className="text-sm text-accent hover:underline font-medium">
          すべて表示 →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">案件番号</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">工事名</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">元請</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ステータス</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">金額</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">期日</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{project.projectNumber}</td>
                <td className="px-5 py-4 text-sm font-medium text-card-foreground">{project.name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{project.client}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
                    {STATUS_LABELS[project.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-medium text-card-foreground text-right">{formatCurrency(project.total)}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground text-right">{project.dueDate}</td>
                <td className="px-5 py-4">
                  <button className="text-muted-foreground hover:text-card-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;

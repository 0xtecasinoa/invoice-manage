import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import StatsCards from "@/components/StatsCards";
import WorkflowPipeline from "@/components/WorkflowPipeline";
import ProjectList from "@/components/ProjectList";
import { Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectsApi, invoicesApi, recordsApi, submissionsApi, costsApi } from "@/lib/api";

const Index = () => {
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });
  const { data: invoicesData } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const { data: recordsData } = useQuery({
    queryKey: ["records"],
    queryFn: () => recordsApi.list(),
  });
  const { data: submissionsData } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
  });
  const { data: costsData } = useQuery({
    queryKey: ["costs"],
    queryFn: () => costsApi.list(),
  });

  const projects = projectsData?.projects ?? [];
  const invoices = invoicesData?.invoices ?? [];
  const records = recordsData?.records ?? [];
  const submissions = submissionsData?.submissions ?? [];
  const costs = costsData?.costs ?? [];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
            <p className="text-sm text-muted-foreground mt-1">業務概況</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium">
              <Link to="/estimates">
                <Plus className="w-4 h-4 mr-2" />
                新規案件
              </Link>
            </Button>
          </div>
        </div>

        {projectsLoading ? (
          <p className="text-muted-foreground">読み込み中...</p>
        ) : (
          <>
            <StatsCards projects={projects} invoices={invoices} costs={costs} />
            <div className="mt-6">
              <WorkflowPipeline
                projects={projects}
                records={records}
                invoices={invoices}
                submissions={submissions}
                costs={costs}
              />
            </div>
            <div className="mt-6">
              <ProjectList projects={projects} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;

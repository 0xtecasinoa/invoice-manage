import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileSignature,
  ListChecks,
  Receipt,
  Send,
  CircleDollarSign,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoHorizontal from "@/assets/logo-horizontal.png";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "ダッシュボード", path: "/" },
  { icon: FileSignature, label: "見積管理", path: "/estimates" },
  { icon: ListChecks, label: "施工実績", path: "/records" },
  { icon: Receipt, label: "請求書作成", path: "/invoices" },
  { icon: Send, label: "提出管理", path: "/submissions" },
  { icon: CircleDollarSign, label: "原価管理", path: "/costs" },
  { icon: Settings, label: "設定", path: "/settings" },
];

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || "ユーザー";
  const initial = displayName.charAt(0);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <img
            src={logoHorizontal}
            alt="KATATI Co.,Ltd."
            className="h-20 w-full object-contain rounded"
            style={{ mixBlendMode: "lighten" }}
          />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                    isActive ? "bg-sidebar-primary-foreground/20" : "bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground shrink-0">
              {initial}
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-medium text-sidebar-primary-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;

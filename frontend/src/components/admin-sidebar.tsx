import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  ShieldHalf,
} from "lucide-react";

type NavItem = {
  to: "/admin" | "/scan" | "/dashboard" | "/security";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};
const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/scan", label: "Live QR Session", icon: ScanLine },
  { to: "/dashboard", label: "Students", icon: Users },
  { to: "/security", label: "Security", icon: ShieldCheck },
  { to: "/admin", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl lg:flex lg:flex-col">
      <Link to="/" className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)]">
          <ShieldHalf className="size-4 text-white" />
        </div>
        <span className="text-sm font-semibold">
          Sentinel<span className="text-primary">.edu</span>
        </span>
      </Link>

      <div className="flex-1 px-3 py-6">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workspace
        </div>
        <nav className="space-y-1">
          {items.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            return (
              <Link
                key={it.label}
                to={it.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
                }`}
              >
                <it.icon className="size-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          System
        </div>
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground">
            <Settings className="size-4" /> Settings
          </a>
        </nav>
      </div>

      <div className="m-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          All systems nominal
        </div>
        <p className="text-[11px] text-muted-foreground">
          Sessions encrypted with rolling AES-256 keys.
        </p>
      </div>
    </aside>
  );
}

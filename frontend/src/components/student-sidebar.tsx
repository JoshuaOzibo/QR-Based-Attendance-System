import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanLine,
  LogOut,
  ShieldHalf,
  Info,
  Settings
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
};
const items: NavItem[] = [
  { to: "/dashboard", label: "My Attendance", icon: LayoutDashboard, exact: true },
  { to: "/about", label: "About System", icon: Info },
];

export function StudentSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

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

      <div className="flex flex-1 flex-col px-3 py-6">
        <div>
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
        </div>

        <div className="mt-auto">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            System
          </div>
          <nav className="space-y-1">
            <Link to="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground">
              <Settings className="size-4" /> Settings
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                navigate({ to: '/login' });
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </nav>
        </div>
      </div>

      <div className="m-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          Student Mode
        </div>
        <p className="text-[11px] text-muted-foreground">
          Your attendance records are securely verified by rolling cryptographic tokens.
        </p>
      </div>
    </aside>
  );
}

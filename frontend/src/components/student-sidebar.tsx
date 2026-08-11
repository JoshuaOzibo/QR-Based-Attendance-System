import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  ShieldHalf,
  Info,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMobileOpen(false);
    navigate({ to: "/login" });
  };

  return (
    <>
      {/* ── MOBILE TOP BAR & HAMBURGER BUTTON (< lg) ── */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-sidebar-border bg-sidebar/90 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)]">
            <ShieldHalf className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold">
            Sentinel<span className="text-primary">.edu</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground transition-colors hover:bg-card active:scale-95"
          aria-label="Open Navigation Menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER PORTAL (< lg) ── */}
      {typeof window !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] flex lg:hidden transition-all duration-300 ${
              mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 ${
                mobileOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer Content */}
            <div
              className={`relative flex w-72 max-w-[85vw] flex-col bg-sidebar border-r border-sidebar-border p-4 shadow-2xl z-10 h-full transition-transform duration-300 ease-in-out ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-sidebar-border pb-4 mb-4">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)]">
                    <ShieldHalf className="size-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold">
                    Sentinel<span className="text-primary">.edu</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg border border-border bg-card/40 text-muted-foreground hover:text-foreground active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between overflow-y-auto">
                <div>
                  <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Workspace
                  </div>
                  <nav className="space-y-1">
                    {items.map((it) => {
                      const active = it.exact
                        ? path === it.to
                        : path.startsWith(it.to);
                      return (
                        <Link
                          key={it.label}
                          to={it.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
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

                <div className="mt-8 space-y-4">
                  <div>
                    <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      System
                    </div>
                    <nav className="space-y-1">
                      <Link
                        to="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
                      >
                        <Settings className="size-4" /> Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600"
                      >
                        <LogOut className="size-4" /> Logout
                      </button>
                    </nav>
                  </div>

                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                      <span className="size-2 animate-pulse rounded-full bg-success" />
                      Student Mode
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Your attendance records are securely verified by rolling cryptographic tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── DESKTOP SIDEBAR (>= lg) ── */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl lg:flex lg:flex-col min-h-screen">
        <Link
          to="/"
          className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6"
        >
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
                const active = it.exact
                  ? path === it.to
                  : path.startsWith(it.to);
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
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <button
                onClick={handleLogout}
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
    </>
  );
}

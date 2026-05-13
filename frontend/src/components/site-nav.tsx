import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Sentinel<span className="text-primary">.edu</span>
          </span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <Link to="/scan" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Scan QR
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Student
          </Link>
          <Link to="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Admin
          </Link>
          <Link to="/security" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Security
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/scan" className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
            Open Scanner
          </Link>
          <Link to="/admin" className="rounded-md bg-foreground px-3.5 py-1.5 text-sm font-semibold text-background ring-1 ring-foreground/10 transition-transform hover:scale-[1.02]">
            Admin Portal
          </Link>
        </div>
      </div>
    </nav>
  );
}

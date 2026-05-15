import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

export function SiteNav() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => fetchAPI<any>('/api/auth/me'),
    retry: false
  });

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
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : authData?.user ? (
            <Link to={authData.user.role === 'LECTURER' ? '/admin' : '/dashboard'} className="rounded-md bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </Link>
              <Link to="/login" className="rounded-md bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

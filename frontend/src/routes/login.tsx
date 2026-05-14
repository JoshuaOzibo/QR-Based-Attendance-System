import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { Lock, User } from "lucide-react";
import { fetchAPI } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — Sentinel.edu" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetchAPI<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ universityRollNo: rollNo, password }),
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
        
        // RBAC Routing
        if (res.user.role === "LECTURER") {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24">
        <div className="w-full rounded-2xl border border-border glass p-8 shadow-[var(--shadow-glow)]">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your Sentinel account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">University ID / Roll No</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., AIT/HND/24/00036 or admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-md bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Test Accounts: <br />
            Lecturer: admin / admin123 <br />
            Student: AIT/HND/24/00036 / student123
          </div>
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { Lock, User } from "lucide-react";
import { fetchAPI } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign Up — Sentinel.edu" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"STUDENT" | "LECTURER">("STUDENT");
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetchAPI<any>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, universityRollNo: rollNo, password, role }),
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
      setError(err.message || "Failed to register. Please try again.");
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
            <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join Sentinel.edu to manage attendance
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="flex rounded-md bg-card/50 p-1 ring-1 ring-border">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`flex-1 rounded-sm py-1.5 text-xs font-semibold transition-colors ${role === "STUDENT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("LECTURER")}
                className={`flex-1 rounded-sm py-1.5 text-xs font-semibold transition-colors ${role === "LECTURER" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Lecturer
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder={role === "STUDENT" ? "Joshua Ozibo" : "Dr. Aris Thorne"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {role === "STUDENT" ? "University Roll No" : "Lecturer ID"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder={role === "STUDENT" ? "e.g., AIT/HND/24/00036" : "e.g., FAC-2026"}
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
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

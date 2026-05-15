import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Mail, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Zap, Users } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Sentinel.edu" },
      { name: "description", content: "Sign in to Sentinel.edu to manage and track attendance." },
    ],
  }),
  component: AuthPage,
});

type Tab = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signin");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto-redirect if already logged in — no flash
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setIsCheckingAuth(false); return; }
    fetchAPI<any>("/api/auth/me")
      .then(res => {
        if (res?.user?.role === "LECTURER") navigate({ to: "/admin" });
        else navigate({ to: "/dashboard" });
      })
      .catch(() => { localStorage.removeItem("token"); setIsCheckingAuth(false); })
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left branding panel (desktop only) ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-[#080810] px-16 py-14">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 size-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Sentinel<span className="text-primary">.edu</span></span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-4">Attendance Intelligence</div>
            <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
              Secure. Verified.<br />Real-time.
            </h2>
            <p className="mt-4 text-base text-white/50 leading-relaxed max-w-sm">
              QR-based attendance with GPS verification and live fraud detection — built for modern institutions.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: Zap,        label: "Instant QR generation",         sub: "Generate session codes in seconds" },
              { icon: ShieldCheck, label: "Fraud-proof verification",      sub: "Device fingerprint + GPS check" },
              { icon: Users,      label: "Live attendance stream",         sub: "Real-time student tracking" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <f.icon className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-xs text-white/40">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative text-xs text-white/25">
          © {new Date().getFullYear()} Sentinel.edu · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <ShieldCheck className="size-6 text-primary" />
          <span className="text-lg font-bold">Sentinel<span className="text-primary">.edu</span></span>
        </div>

        <div className="w-full max-w-sm">
          {tab === "signin"  && <SignInForm  onSwitch={setTab} onSuccess={navigate} />}
          {tab === "signup"  && <SignUpForm  onSwitch={setTab} onSuccess={navigate} />}
          {tab === "forgot"  && <ForgotForm  onSwitch={setTab} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sign In Form                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function SignInForm({ onSwitch, onSuccess }: { onSwitch: (t: Tab) => void; onSuccess: any }) {
  const [rollNo, setRollNo]       = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetchAPI<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ universityRollNo: rollNo.trim(), password }),
      });
      if (res.token) {
        localStorage.setItem("token", res.token);
        toast.success(`Welcome back, ${res.user.name}!`);
        if (res.user.role === "LECTURER") onSuccess({ to: "/admin" });
        else onSuccess({ to: "/dashboard" });
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your Sentinel account to continue</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="University ID / Roll No"
          icon={<User className="size-4" />}
          value={rollNo}
          onChange={setRollNo}
          placeholder="e.g. AIT/HND/24/00036"
          autoComplete="username"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Password</label>
            <button type="button" onClick={() => onSwitch("forgot")} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <PasswordField value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(p => !p)} placeholder="••••••••" />
        </div>

        <SubmitButton loading={loading} label="Sign in" />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={() => onSwitch("signup")} className="font-semibold text-primary hover:underline">
          Create one
        </button>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sign Up Form                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function SignUpForm({ onSwitch, onSuccess }: { onSwitch: (t: Tab) => void; onSuccess: any }) {
  const [role, setRole]           = useState<"STUDENT" | "LECTURER">("STUDENT");
  const [name, setName]           = useState("");
  const [rollNo, setRollNo]       = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColor   = ["", "bg-destructive", "bg-warning", "bg-success"][pwStrength];
  const pwLabel   = ["", "Too short", "Fair", "Strong"][pwStrength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim() || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetchAPI<any>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), universityRollNo: rollNo.trim(), password, role }),
      });
      if (res.token) {
        localStorage.setItem("token", res.token);
        toast.success("Account created! Welcome to Sentinel.");
        if (res.user.role === "LECTURER") onSuccess({ to: "/admin" });
        else onSuccess({ to: "/dashboard" });
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join Sentinel.edu in seconds</p>
      </div>

      {/* Role selector */}
      <div className="mb-5 flex rounded-xl bg-card/50 p-1 ring-1 ring-border">
        {(["STUDENT", "LECTURER"] as const).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              role === r
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "STUDENT" ? "👨‍🎓 Student" : "🎓 Lecturer"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="Full Name"
          icon={<User className="size-4" />}
          value={name}
          onChange={setName}
          placeholder={role === "STUDENT" ? "Joshua Ozibo" : "Dr. Aris Thorne"}
          autoComplete="name"
        />
        <Field
          label={role === "STUDENT" ? "University Roll No" : "Lecturer ID"}
          icon={<Mail className="size-4" />}
          value={rollNo}
          onChange={setRollNo}
          placeholder={role === "STUDENT" ? "e.g. AIT/HND/24/00036" : "e.g. FAC-2026"}
          autoComplete="username"
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <PasswordField value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(p => !p)} placeholder="Create a password" />
          {password && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex flex-1 gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength ? pwColor : "bg-border"}`} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{pwLabel}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm Password</label>
          <PasswordField value={confirm} onChange={setConfirm} show={showCf} onToggle={() => setShowCf(p => !p)} placeholder="Repeat your password" />
          {confirm && password !== confirm && (
            <p className="text-[11px] text-destructive">Passwords don't match</p>
          )}
        </div>

        <SubmitButton loading={loading} label="Create account" />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={() => onSwitch("signin")} className="font-semibold text-primary hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Forgot Password Form                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function ForgotForm({ onSwitch }: { onSwitch: (t: Tab) => void }) {
  const [rollNo, setRollNo]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ message: string; exists: boolean } | null>(null);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) { setError("Please enter your University ID."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetchAPI<any>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ universityRollNo: rollNo.trim() }),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => onSwitch("signin")} className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Back to sign in
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your ID and we'll look up your account.</p>
      </div>

      {result ? (
        <div className={`rounded-xl p-5 text-sm ${result.exists ? "bg-success/10 border border-success/20" : "bg-card/50 border border-border"}`}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`size-5 shrink-0 mt-0.5 ${result.exists ? "text-success" : "text-muted-foreground"}`} />
            <div>
              <p className="font-semibold mb-1">{result.exists ? "Account found" : "Account not found"}</p>
              <p className="text-muted-foreground leading-relaxed">{result.message}</p>
            </div>
          </div>
          <button onClick={() => onSwitch("signin")} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            Return to sign in <ArrowRight className="size-3" />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <Field
            label="University ID / Roll No"
            icon={<User className="size-4" />}
            value={rollNo}
            onChange={setRollNo}
            placeholder="e.g. AIT/HND/24/00036"
          />
          <SubmitButton loading={loading} label="Look up account" />
        </form>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shared sub-components                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function Field({ label, icon, value, onChange, placeholder, autoComplete }: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          type="text"
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-border bg-card/50 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-card/80"
        />
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="current-password"
        className="w-full rounded-xl border border-border bg-card/50 py-3 pl-10 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-card/80"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.01] hover:shadow-lg disabled:opacity-60 disabled:scale-100"
    >
      {loading ? (
        <><Loader2 className="size-4 animate-spin" /> Please wait…</>
      ) : (
        <>{label} <ArrowRight className="size-4" /></>
      )}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
      {message}
    </div>
  );
}

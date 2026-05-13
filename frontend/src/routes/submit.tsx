import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { MapPin, ShieldCheck, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit Attendance — Sentinel.edu" },
      { name: "description", content: "Confirm your details to mark verified attendance for the active classroom session." },
    ],
  }),
  component: SubmitPage,
});

const Schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  rollNumber: z.string().trim().min(3, "University roll required").max(40),
  section: z.string().trim().min(1, "Section required").max(10),
  classRoll: z.string().trim().min(1, "Class roll required").max(10),
});

type FormState = z.infer<typeof Schema>;

function SubmitPage() {
  const [form, setForm] = useState<FormState>({ fullName: "", rollNumber: "", section: "", classRoll: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      toast.success("Attendance marked successfully", { description: "CS-402 · 10:14 AM · Hall B-12" });
    }, 1400);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            <div className="relative flex size-24 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
              <CheckCircle2 className="size-12 text-success" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Attendance Marked Successfully</h1>
          <p className="mt-3 text-muted-foreground">
            Your verified entry has been added to the ledger for{" "}
            <span className="text-foreground">CS-402 · Hall B-12</span>.
          </p>
          <div className="mt-8 grid w-full grid-cols-3 gap-3 text-left">
            <Tile label="Session" value="#SEC-8829-01" />
            <Tile label="Time" value="10:14 AM" />
            <Tile label="GPS" value="±8m" />
          </div>
          <Link
            to="/dashboard"
            className="mt-10 inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            View Dashboard <ArrowRight className="size-4" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Step 2 of 2</div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Confirm your attendance</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            We&apos;ve validated the QR session and your location. Confirm your identity to commit your record.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <Field
              label="Full Name"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              error={errors.fullName}
              placeholder="Marcus Holloway"
            />
            <Field
              label="University Roll Number"
              value={form.rollNumber}
              onChange={(v) => setForm({ ...form, rollNumber: v })}
              error={errors.rollNumber}
              placeholder="CS2024-042"
              mono
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Section"
                value={form.section}
                onChange={(v) => setForm({ ...form, section: v.toUpperCase() })}
                error={errors.section}
                placeholder="A"
                mono
              />
              <Field
                label="Class Roll"
                value={form.classRoll}
                onChange={(v) => setForm({ ...form, classRoll: v })}
                error={errors.classRoll}
                placeholder="14"
                mono
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Validating session…
                </>
              ) : (
                <>Mark My Attendance</>
              )}
            </button>
          </form>
        </div>

        {/* Right verification card */}
        <aside className="space-y-4">
          <div className="rounded-2xl glass-strong p-6 ring-glow">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-success">
                Verified
              </span>
              <ShieldCheck className="size-4 text-success" />
            </div>
            <div className="text-sm font-medium">CS-402 Systems Architecture</div>
            <div className="mt-1 text-xs text-muted-foreground">Session #SEC-8829-01 · Active 84s</div>

            <div className="mt-6 space-y-3 text-sm">
              <RowK k="Classroom" v="Hall B-12" />
              <RowK k="Faculty" v="Dr. Aris Thorne" />
              <RowK k="Started" v="10:00 AM" />
              <RowK k="Scanned" v="42 / 60" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-primary" /> GPS Verification
            </div>
            <div className="text-xs text-muted-foreground">
              Within geofence radius. Coordinates locked to the registered hall.
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              ±8m precision · IP coherent
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-border bg-card/40 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 ${
          mono ? "font-mono tracking-tight" : ""
        } ${error ? "border-destructive/60" : ""}`}
      />
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function RowK({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

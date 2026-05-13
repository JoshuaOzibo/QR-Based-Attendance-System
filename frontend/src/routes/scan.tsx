import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { LiveQrCard } from "@/components/live-qr-card";
import { ShieldCheck, MapPin, Radio, ArrowRight, Camera } from "lucide-react";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Live QR Session — Sentinel.edu" },
      {
        name: "description",
        content:
          "Rolling 90-second QR session for secure classroom attendance. Scan or display the active session QR code.",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Live Classroom Session
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Advanced Computer Science · Hall B-12
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dr. Aris Thorne · Wednesday, May 13 · 10:00 — 11:30
            </p>
          </div>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            I&apos;ve scanned — Continue <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* Left — security + permissions */}
          <div className="space-y-6">
            <PermissionRow
              icon={<Camera className="size-4" />}
              label="Camera permission"
              status="Granted"
              tone="success"
            />
            <PermissionRow
              icon={<MapPin className="size-4" />}
              label="GPS location"
              status="Verified · Hall B-12 (±8m)"
              tone="success"
            />
            <PermissionRow
              icon={<Radio className="size-4" />}
              label="Network channel"
              status="Encrypted · TLS 1.3"
              tone="success"
            />
            <PermissionRow
              icon={<ShieldCheck className="size-4" />}
              label="Session validator"
              status="Active · Rolling keys"
              tone="success"
            />

            <div className="rounded-2xl border border-border glass p-6">
              <h3 className="text-sm font-semibold">How it works</h3>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <Step n={1} text="Faculty starts a session — a rolling QR is generated." />
                <Step n={2} text="Students scan within 90 seconds; keys rotate continuously." />
                <Step n={3} text="GPS + session token validated server-side before commit." />
                <Step n={4} text="Attendance ledger updates in real time on the dashboard." />
              </ol>
            </div>
          </div>

          {/* Right — live QR */}
          <div className="lg:sticky lg:top-24">
            <LiveQrCard />
          </div>
        </div>
      </main>
    </div>
  );
}

function PermissionRow({
  icon,
  label,
  status,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  tone: "success" | "warning";
}) {
  const dot = tone === "success" ? "bg-success" : "bg-warning";
  const text = tone === "success" ? "text-success" : "text-warning";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className={`text-xs ${text}`}>{status}</div>
        </div>
      </div>
      <span className={`size-2 rounded-full ${dot} animate-pulse`} />
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-foreground">
        {n}
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { KpiCard } from "@/components/kpi-card";
import {
  ShieldCheck,
  AlertTriangle,
  Radio,
  MapPin,
  Lock,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security & Analytics — Sentinel.edu" },
      { name: "description", content: "Fraud prevention overview, geolocation verification, and live security telemetry." },
    ],
  }),
  component: SecurityPage,
});

const expirations = Array.from({ length: 24 }).map((_, i) => ({
  t: `${i}:00`,
  v: 60 + Math.round(Math.cos(i / 2) * 25 + Math.random() * 15),
}));

const events = [
  { t: "10:18:02", k: "Geofence breach blocked", s: "warning", m: "CS2024-077 · 312m off-radius" },
  { t: "10:14:48", k: "QR session rotated", s: "info", m: "#SEC-8829-01 → #SEC-8829-02" },
  { t: "10:09:12", k: "Duplicate device flagged", s: "warning", m: "Same MAC under 2 roll numbers" },
  { t: "09:58:30", k: "TLS handshake renegotiated", s: "info", m: "Edge node EU-3" },
  { t: "09:42:11", k: "Session validator armed", s: "success", m: "Hall B-12 perimeter live" },
];

function SecurityPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Security Operations
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Sentinel security canvas</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Telemetry across active sessions, geolocation perimeter, and rolling key infrastructure — updated
            every second.
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Fraud prevention rate" value="99.98%" delta="0 false negatives 30d" icon={ShieldCheck} />
          <KpiCard label="Anomalies blocked" value="124" delta="this month" deltaTone="neutral" icon={AlertTriangle} />
          <KpiCard label="Active perimeters" value="14" delta="halls geofenced" deltaTone="neutral" icon={MapPin} />
          <KpiCard label="Avg key rotation" value="89.4s" delta="within tolerance" icon={Lock} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Geofence map */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Geolocation verification</h3>
                <p className="text-xs text-muted-foreground">Live perimeter integrity</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" /> Operational
              </span>
            </div>

            <div className="relative h-72 overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle_at_50%_50%,oklch(0.62_0.21_265/0.18),transparent_70%)]">
              {/* Grid */}
              <svg className="absolute inset-0 size-full opacity-30">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(1 0 0 / 0.1)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Perimeter ping */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute inset-0 -m-16 animate-ping rounded-full border border-primary/40" />
                <div className="absolute inset-0 -m-8 rounded-full border border-primary/30" />
                <div className="relative flex size-4 items-center justify-center rounded-full bg-primary shadow-[0_0_30px_oklch(0.62_0.21_265)]">
                  <div className="size-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* Verified dots */}
              {[
                [22, 30],
                [70, 22],
                [80, 60],
                [35, 70],
                [55, 80],
                [18, 55],
                [60, 40],
              ].map(([x, y], i) => (
                <div
                  key={i}
                  className="absolute size-2 rounded-full bg-success shadow-[0_0_10px_oklch(0.72_0.17_160)]"
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              ))}

              {/* Anomaly */}
              <div
                className="absolute size-2.5 rounded-full bg-warning shadow-[0_0_14px_oklch(0.78_0.17_70)]"
                style={{ left: "92%", top: "12%" }}
              >
                <div className="absolute -inset-2 animate-ping rounded-full border border-warning/50" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <Legend dot="bg-primary" label="Hall B-12 anchor" />
              <Legend dot="bg-success" label="Verified students (42)" />
              <Legend dot="bg-warning" label="Anomaly · 1 flagged" />
            </div>
          </div>

          {/* Session expiration analytics */}
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-base font-semibold">Session expirations · 24h</h3>
            <p className="text-xs text-muted-foreground">Rolling key turnover</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expirations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="t" stroke="oklch(0.7 0.02 260)" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                  <YAxis stroke="oklch(0.7 0.02 260)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.22 0.025 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="oklch(0.72 0.18 265)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <Stat label="Issued" value="2,841" />
              <Stat label="Rotated" value="2,805" />
              <Stat label="Revoked" value="3" />
            </div>
          </div>
        </section>

        {/* Activity timeline */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-base font-semibold">System status</h3>
            <p className="text-xs text-muted-foreground">All Sentinel infrastructure</p>
            <div className="mt-5 space-y-4">
              {[
                { k: "QR Generator API", v: "Operational", icon: Radio },
                { k: "Geo Validator", v: "Operational", icon: MapPin },
                { k: "Session Ledger", v: "Operational", icon: Lock },
                { k: "Real-time Stream", v: "Operational", icon: Activity },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <row.icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{row.k}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-success">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" /> {row.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-base font-semibold">Security activity</h3>
            <p className="text-xs text-muted-foreground">Most recent first</p>
            <ol className="mt-5 space-y-5 border-l border-border pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[26px] top-1 size-3 rounded-full ring-4 ring-background ${
                      e.s === "warning"
                        ? "bg-warning"
                        : e.s === "success"
                          ? "bg-success"
                          : "bg-primary"
                    }`}
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm font-medium">{e.k}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{e.t}</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.m}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

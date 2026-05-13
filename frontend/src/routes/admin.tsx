import { createFileRoute } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { KpiCard } from "@/components/kpi-card";
import {
  Bell,
  Search,
  Play,
  Square,
  Download,
  Users,
  Activity,
  Radio,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Sentinel.edu" },
      { name: "description", content: "Live attendance monitoring, session control, and student management." },
    ],
  }),
  component: AdminPage,
});

const submissions = Array.from({ length: 12 }).map((_, i) => ({
  hour: `${9 + i}:00`,
  count: 30 + Math.round(Math.random() * 90),
}));

function AdminPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { data: initialLive = [] } = useQuery({
    queryKey: ['attendance', 'live', today],
    queryFn: () => fetchAPI<any>(`/api/attendance/by-date?date=${today}`).then(res => res.data)
  });

  const [liveStream, setLiveStream] = useState<any[]>([]);

  useEffect(() => {
    if (initialLive && Array.isArray(initialLive)) {
      setLiveStream(initialLive);
    }
  }, [initialLive]);

  useEffect(() => {
    const sseUrl = import.meta.env.VITE_API_BASE_URL 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/attendance/live`
      : 'http://localhost:5000/api/attendance/live';
    
    const evtSource = new EventSource(sseUrl);
    evtSource.onmessage = (event) => {
      try {
        const newRecord = JSON.parse(event.data);
        setLiveStream(prev => [newRecord, ...prev]);
      } catch(e) {}
    };
    return () => evtSource.close();
  }, []);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const res = await fetchAPI<any>('/api/generate-qr');
      setQrCode(`http://localhost:5000${res.qrImage}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const live = liveStream.map(r => ({
    name: r.name || "Unknown",
    roll: r.universityRollNo || "N/A",
    time: r.time || new Date(r.createdAt || Date.now()).toLocaleTimeString(),
    verify: r.distanceFromClass && r.distanceFromClass < 50 ? "GPS Verified" : "Network Check",
    status: r.status === "present" ? "Present" : "Flagged",
    rawId: r._id
  }));
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/70 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search students, sessions, halls…"
                className="w-72 rounded-md border border-border bg-card/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warning" />
            </button>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 py-1 pl-1 pr-3">
              <div className="flex size-7 items-center justify-center rounded bg-[image:var(--gradient-primary)] text-xs font-bold text-white">
                AT
              </div>
              <div className="text-xs">
                <div className="font-semibold">Dr. Aris Thorne</div>
                <div className="text-muted-foreground">Faculty</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          {/* Session control */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl glass-strong p-6 ring-glow">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">
                ● Session Active · 11m elapsed
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">CS-402 Systems Architecture</h2>
              <p className="text-sm text-muted-foreground">Hall B-12 · Spring 2026 · 60 students enrolled</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleGenerateQR} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-card disabled:opacity-50">
                <Play className="size-4" /> {isGenerating ? "Generating..." : "Generate New QR"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-md bg-destructive/15 px-4 py-2.5 text-sm font-semibold text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/25">
                <Square className="size-4" /> End Session
              </button>
            </div>
          </div>
          
          {qrCode && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4">Active Session QR</h3>
              <img src={qrCode} alt="Scan to mark attendance" className="w-64 h-64 rounded-lg bg-white p-2" />
            </div>
          )}

          {/* KPIs */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total students" value="1,482" delta="+24 this term" icon={Users} />
            <KpiCard label="Present today" value="1,318" delta="88.9% of enrolled" icon={Activity} />
            <KpiCard label="Active sessions" value="12" delta="across 4 faculties" deltaTone="neutral" icon={Radio} />
            <KpiCard label="Fraud prevention" value="99.98%" delta="2 anomalies blocked" icon={ShieldCheck} />
          </div>

          {/* Chart + completion */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-border bg-card/40 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Submissions today</h3>
                  <p className="text-xs text-muted-foreground">Per hour, all sessions</p>
                </div>
                <div className="text-xs text-success">Peak 11:00 · 124 scans</div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={submissions}>
                    <defs>
                      <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 265)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.22 265)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                    <XAxis dataKey="hour" stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                      contentStyle={{
                        background: "oklch(0.22 0.025 265)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="url(#bg)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-6">
              <h3 className="text-base font-semibold">Completion by section</h3>
              <p className="text-xs text-muted-foreground">CS-402 · live</p>
              <div className="mt-6 space-y-5">
                {[
                  { s: "Section A", v: 92 },
                  { s: "Section B", v: 78 },
                  { s: "Section C", v: 84 },
                  { s: "Section D", v: 61 },
                ].map((row) => (
                  <div key={row.s}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium">{row.s}</span>
                      <span className="font-mono text-muted-foreground">{row.v}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                        style={{ width: `${row.v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live attendance feed */}
          <section className="rounded-2xl border border-border bg-card/40">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold">Live attendance stream</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" /> Real-time
                </span>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold">
                <Download className="size-3.5" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-card/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Student</th>
                    <th className="px-6 py-3 font-semibold">Roll</th>
                    <th className="px-6 py-3 font-semibold">Verification</th>
                    <th className="px-6 py-3 font-semibold">Time</th>
                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {live.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No attendance recorded today yet.</td>
                    </tr>
                  )}
                  {live.map((r: any) => (
                    <tr key={r.rawId || r.roll + r.time} className="transition-colors hover:bg-card/60">
                      <td className="flex items-center gap-3 px-6 py-3.5 font-medium">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                          {r.name.split(" ").map((p: any) => p[0]).join("")}
                        </div>
                        {r.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{r.roll}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            r.verify.includes("Verified")
                              ? "text-success"
                              : r.verify.includes("Proxy")
                                ? "text-warning"
                                : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              r.verify.includes("Verified")
                                ? "bg-success"
                                : r.verify.includes("Proxy")
                                  ? "bg-warning"
                                  : "bg-muted-foreground"
                            }`}
                          />
                          {r.verify}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">{r.time}</td>
                      <td className="px-6 py-3.5 text-right">
                        {r.status === "Present" ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                            PRESENT
                          </span>
                        ) : (
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                            FLAGGED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

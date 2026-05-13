import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { KpiCard } from "@/components/kpi-card";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Sentinel.edu" },
      { name: "description", content: "Personal attendance analytics, trends, and threshold insights." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const rollNo = "AIT/HND/24/00036";
  
  const { data, isLoading } = useQuery({
    queryKey: ['studentAttendance', rollNo],
    queryFn: () => fetchAPI<any>(`/api/students/${encodeURIComponent(rollNo)}/attendance`).then(res => res.data)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 py-10 flex items-center justify-center h-64">
           <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  const percent = data?.attendancePercentage ?? 0;
  
  // Map trend from chartData
  const trend = data?.chartData?.labels?.map((label: string, i: number) => ({
    day: label,
    pct: data.chartData.studentAttendance[i]
  })) || [];

  const recent = data?.attendanceRecords?.slice().reverse().slice(0, 5).map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    course: "System Verified", // Backend doesn't store course name yet
    time: r.time || new Date(r.createdAt).toLocaleTimeString(),
    status: r.status === "present" ? "Present" : "Absent"
  })) || [];
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Welcome back
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your attendance pulse</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rollNo}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-success" /> Live · synced 12s ago
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Hero ring */}
          <div className="rounded-2xl glass-strong p-6 ring-glow lg:row-span-2">
            <div className="text-xs font-medium text-muted-foreground">Overall attendance</div>
            <div className="mt-6 flex items-center justify-center">
              <ProgressRing value={percent} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg border border-border bg-card/30 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Present</div>
                <div className="mt-1 text-lg font-semibold text-success">{data?.presentDays ?? 0}</div>
              </div>
              <div className="rounded-lg border border-border bg-card/30 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Total Classes</div>
                <div className="mt-1 text-lg font-semibold text-primary">{data?.totalClasses ?? 0}</div>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-success/10 px-3 py-3 text-xs text-success">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" />
              <span>Excellent attendance — you&apos;re 9 points above threshold.</span>
            </div>
          </div>

          <KpiCard label="This week" value="5/6" delta="83% present" icon={CheckCircle2} />
          <KpiCard label="Streak" value="12 days" delta="+3 best" icon={TrendingUp} />
          <KpiCard label="Next class" value="11:00" delta="MA-211 · Hall A-3" deltaTone="neutral" icon={CalendarDays} />
          <KpiCard
            label="At-risk courses"
            value="1"
            delta="EE-301 below 75%"
            deltaTone="warning"
            icon={AlertTriangle}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Attendance trend</h3>
                <p className="text-xs text-muted-foreground">Last 14 sessions</p>
              </div>
              <div className="text-xs text-success">+4.2% vs prior fortnight</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.21 265)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.62 0.21 265)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="day" stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.22 0.025 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pct"
                    stroke="oklch(0.72 0.18 265)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-base font-semibold">Monthly heatmap</h3>
            <p className="text-xs text-muted-foreground">Each cell = 1 session</p>
            <div className="mt-5 grid grid-cols-10 gap-1.5">
              {Array.from({ length: 60 }).map((_, i) => {
                const v = Math.random();
                const cls =
                  v > 0.85
                    ? "bg-warning/40"
                    : v > 0.7
                      ? "bg-success/30"
                      : v > 0.4
                        ? "bg-success/60"
                        : v > 0.15
                          ? "bg-success"
                          : "bg-border";
                return <div key={i} className={`aspect-square rounded ${cls}`} />;
              })}
            </div>
            <div className="mt-5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {["bg-border", "bg-success/30", "bg-success/60", "bg-success", "bg-warning/40"].map(
                  (c) => (
                    <span key={c} className={`size-2.5 rounded ${c}`} />
                  ),
                )}
              </div>
              <span>More</span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">Recent activity</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Export CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Course</th>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recent.map((r: any, i: number) => (
                <tr key={i} className="transition-colors hover:bg-card/60">
                  <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-6 py-3.5">{r.course}</td>
                  <td className="px-6 py-3.5 font-mono text-xs">{r.time}</td>
                  <td className="px-6 py-3.5 text-right">
                    {r.status === "Present" ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                        ABSENT
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative size-44">
      <svg viewBox="0 0 180 180" className="size-full -rotate-90">
        <circle cx="90" cy="90" r={r} stroke="oklch(1 0 0 / 0.06)" strokeWidth="10" fill="none" />
        <circle
          cx="90"
          cy="90"
          r={r}
          stroke="url(#ringG)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringG" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 265)" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 265)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-semibold tracking-tight">{value}%</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Above 75</div>
      </div>
    </div>
  );
}

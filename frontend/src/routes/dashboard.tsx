import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentSidebar } from "@/components/student-sidebar";
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
  Download,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      throw redirect({ to: '/login' });
    }
  },
  head: () => ({
    meta: [
      { title: "Student Dashboard — Sentinel.edu" },
      { name: "description", content: "Personal attendance analytics, trends, and threshold insights." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const navigate = useNavigate();

  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => fetchAPI<any>('/api/auth/me'),
    retry: false
  });

  useEffect(() => {
    if (authError) {
      navigate({ to: '/login' });
    } else if (authData?.user && authData.user.role !== 'STUDENT') {
      navigate({ to: '/admin' });
    }
  }, [authData, authError, navigate]);

  const rollNo = authData?.user?.universityRollNo || "";
  
  const { data, isLoading: dataLoading } = useQuery({
    queryKey: ['studentAttendance', rollNo],
    queryFn: () => fetchAPI<any>(`/api/students/${encodeURIComponent(rollNo)}/attendance`).then(res => res.data),
    enabled: !!rollNo
  });

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

  if (authLoading || dataLoading || !rollNo) {
    return (
      <div className="flex min-h-screen bg-background">
        <StudentSidebar />
        <main className="flex-1 flex items-center justify-center h-screen">
           <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  const percent = data?.attendancePercentage ?? 0;
  
  const trend = data?.chartData?.labels?.map((label: string, i: number) => ({
    day: label,
    pct: data.chartData.studentAttendance[i]
  })) || [];

  const live = liveStream.map(r => ({
    name: r.name || "Unknown",
    roll: r.universityRollNo || "N/A",
    time: r.time || new Date(r.createdAt || Date.now()).toLocaleTimeString(),
    verify: r.distanceFromClass && r.distanceFromClass < 50 ? "GPS Verified" : "Network Check",
    status: r.status === "present" ? "Present" : "Flagged",
    rawId: r._id
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-6 py-10 lg:p-10">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Welcome back, {authData?.user?.name || "Student"}
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your attendance pulse</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {rollNo}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-success" /> Live · synced just now
            </div>
          </header>

          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                <span>Excellent attendance — you&apos;re safely above threshold.</span>
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

          {/* Live attendance feed */}
          <section className="mt-8 rounded-2xl border border-border bg-card/40">
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

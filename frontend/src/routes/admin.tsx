import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { KpiCard } from "@/components/kpi-card";
import {
  Download,
  Activity,
  Radio,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      throw redirect({ to: '/login' });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin Console — Sentinel.edu" },
      { name: "description", content: "Live attendance monitoring, session control, and student management." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();

  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => fetchAPI<any>('/api/auth/me'),
    retry: false
  });

  useEffect(() => {
    if (authError) {
      navigate({ to: '/login' });
    } else if (authData?.user && authData.user.role !== 'LECTURER') {
      navigate({ to: '/dashboard' });
    }
  }, [authData, authError, navigate]);

  const today = new Date().toISOString().split('T')[0];

  const { data: initialLive = [] } = useQuery({
    queryKey: ['attendance', 'live', today],
    queryFn: () => fetchAPI<any>(`/api/attendance/by-date?date=${today}`).then(res => res.data)
  });

  const { data: statsData } = useQuery({
    queryKey: ['attendanceStats', today],
    queryFn: () => fetchAPI<any>('/api/attendance/stats').then(res => res.data)
  });

  const stats = statsData || {
    totalStudents: 0,
    presentToday: 0,
    activeSessions: 0,
    fraudPrevention: '99.98%',
    anomaliesBlocked: 0
  };

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const lecturerName = authData?.user?.name || "Lecturer";

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
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background/70 px-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">{greeting}, {lecturerName}</h2>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          {/* KPIs */}
          <div className="grid gap-5 sm:grid-cols-2">
            <KpiCard label="Present today" value={stats.presentToday.toString()} delta="Verified today" icon={Activity} />
            <KpiCard label="Active sessions" value={stats.activeSessions.toString()} delta="Ongoing" deltaTone="neutral" icon={Radio} />
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

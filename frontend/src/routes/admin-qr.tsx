import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Play, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-qr")({
  beforeLoad: () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      throw redirect({ to: '/login' });
    }
  },
  head: () => ({
    meta: [{ title: "Generate QR — Sentinel.edu" }],
  }),
  component: AdminQRPage,
});

function AdminQRPage() {
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

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const [form, setForm] = useState({
    courseTitle: "",
    hall: "",
    lecturerName: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
    if (authData?.user) {
      setForm(prev => ({
        ...prev,
        lecturerName: authData.user.name || ""
      }));
    }
  }, [authData]);

  // Fetch active session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetchAPI<any>('/api/active-session');
        if (res.hasSession && res.session) {
          const s = res.session;
          setForm({
            courseTitle: s.courseTitle || "",
            hall: s.hall || "",
            lecturerName: s.lecturerName || "",
            date: s.date || new Date().toISOString().split('T')[0],
            startTime: s.startTime || "",
            endTime: s.endTime || ""
          });
          setQrCode(s.qrImage || null);
          setActiveSessionId(s.sessionId);
          setExpiresAt(s.expiresAt);
        }
      } catch (err) {}
    };
    if (authData?.user?.role === 'LECTURER') {
      fetchSession();
    }
  }, [authData]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        handleEndSession();
        toast.warning("Session expired automatically.");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleEndSession = async () => {
    try {
      await fetchAPI('/api/end-session', { method: 'DELETE' });
    } catch(err) {}
    setQrCode(null);
    setActiveSessionId(null);
    setExpiresAt(null);
    setTimeLeft("");
  };

  const handleGenerateQR = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetchAPI<any>("/api/generate-qr", { 
        method: "POST",
        body: JSON.stringify(form)
      });
      setQrCode(res.qrImage);
      setActiveSessionId(res.sessionId);
      setExpiresAt(res.expiresAt);
      toast.success("Session started successfully!");
    } catch (error: any) {
      console.error("Failed to generate QR:", error);
      toast.error(error.message || "Failed to start session.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || (authData?.user && authData.user.role !== 'LECTURER')) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading portal...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-6 py-10 lg:p-10">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Session Management
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Active QR Session</h1>
            </div>
          </header>

          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10 flex flex-col items-center justify-center min-h-[500px]">
            {qrCode ? (
              <div className="text-center w-full flex flex-col items-center">
                <div className="mb-6 text-[14px] font-bold uppercase tracking-[0.2em] text-success flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                  Session Active · {form.courseTitle}
                </div>
                <h2 className="mb-8 text-3xl font-semibold tracking-tight">Scan to mark attendance</h2>
                
                <div className="mb-8 grid grid-cols-2 gap-4 text-left max-w-md w-full">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Hall</div>
                    <div className="mt-1 font-semibold">{form.hall || "N/A"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Time Remaining</div>
                    <div className="mt-1 font-semibold text-primary font-mono">{timeLeft || "Computing..."}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-glow)] inline-block">
                  <img src={qrCode} alt="Scan to mark attendance" className="w-[400px] h-[400px]" />
                </div>
                
                <div className="mt-10 flex justify-center gap-4">
                  <button onClick={() => handleGenerateQR()} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/80 px-6 py-3 text-sm font-semibold transition-colors hover:bg-card disabled:opacity-50">
                    <Play className="size-4" /> {isGenerating ? "Regenerating..." : "Regenerate QR"}
                  </button>
                  <button onClick={handleEndSession} className="inline-flex items-center gap-2 rounded-md bg-destructive/15 px-6 py-3 text-sm font-semibold text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/25">
                    <Square className="size-4" /> End Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold tracking-tight">Configure New Session</h2>
                  <p className="mt-2 text-muted-foreground">Enter the details for this class session before generating the QR code.</p>
                </div>

                <form onSubmit={handleGenerateQR} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Course Title</label>
                    <input 
                      required
                      value={form.courseTitle}
                      onChange={e => setForm({...form, courseTitle: e.target.value})}
                      placeholder="e.g. Web Development"
                      className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Hall</label>
                      <input 
                        required
                        value={form.hall}
                        onChange={e => setForm({...form, hall: e.target.value})}
                        placeholder="e.g. auditorium"
                        className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date</label>
                      <input 
                        type="date"
                        required
                        value={form.date}
                        onChange={e => setForm({...form, date: e.target.value})}
                        className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name of Lecturer</label>
                    <input 
                      required
                      value={form.lecturerName}
                      onChange={e => setForm({...form, lecturerName: e.target.value})}
                      placeholder="e.g. Dr. Steve"
                      className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Time</label>
                      <input 
                        type="time"
                        required
                        value={form.startTime}
                        onChange={e => setForm({...form, startTime: e.target.value})}
                        className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">End Time</label>
                      <input 
                        type="time"
                        required
                        value={form.endTime}
                        onChange={e => setForm({...form, endTime: e.target.value})}
                        className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isGenerating} 
                    className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    <Play className="size-4" /> {isGenerating ? "Generating..." : "Start Session & Generate QR"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

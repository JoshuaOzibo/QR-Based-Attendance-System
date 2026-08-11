import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Play, Square, Clock, CalendarClock, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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

/** Format local Date to YYYY-MM-DD string without UTC offset issues */
function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Format milliseconds into a readable H:MM:SS or M:SS string */
function formatMs(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Parse a date string + time string ("HH:MM") into a Unix timestamp */
function parseDateTime(date: string, time: string): number {
  return new Date(`${date}T${time}`).getTime();
}

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

  // ── Active session state ──
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // ── Scheduled session state ──
  // "idle"      → form visible, nothing scheduled
  // "scheduled" → startTime is in the future; showing countdown
  const [scheduleMode, setScheduleMode] = useState<"idle" | "scheduled">("idle");
  const [scheduleStartAt, setScheduleStartAt] = useState<number | null>(null);
  const [scheduleCountdown, setScheduleCountdown] = useState<string>("");
  const scheduleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    courseTitle: "",
    hall: "",
    lecturerName: "",
    date: getLocalDateString(),
    startTime: "",
    endTime: ""
  });

  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // ── The actual QR generation call ──
  const doGenerateQR = useCallback(async (formToUse?: typeof form) => {
    setIsGenerating(true);
    const dataToSend = formToUse || formRef.current;
    try {
      const res = await fetchAPI<any>("/api/generate-qr", {
        method: "POST",
        body: JSON.stringify(dataToSend)
      });
      setQrCode(res.qrImage);
      setActiveSessionId(res.sessionId);
      setExpiresAt(res.expiresAt);
      // Clear scheduled session from localStorage since we now have an active session
      localStorage.removeItem('sentinel_scheduled_session');
      toast.success("Session started successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start session.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (authData?.user) {
      setForm(prev => ({ ...prev, lecturerName: authData.user.name || "" }));
    }
  }, [authData]);

  const hasFetchedSessionRef = useRef(false);

  // Restore any active session on mount (only once per page mount)
  useEffect(() => {
    if (!authData?.user || authData.user.role !== 'LECTURER') return;
    if (hasFetchedSessionRef.current) return;
    hasFetchedSessionRef.current = true;

    const fetchSession = async () => {
      try {
        const res = await fetchAPI<any>('/api/active-session');
        if (res.hasSession && res.session) {
          const s = res.session;
          setForm({
            courseTitle: s.courseTitle || "",
            hall: s.hall || "",
            lecturerName: s.lecturerName || "",
            date: s.date || getLocalDateString(),
            startTime: s.startTime || "",
            endTime: s.endTime || ""
          });
          setQrCode(s.qrImage || null);
          setActiveSessionId(s.sessionId);
          setExpiresAt(s.expiresAt);
          // If we restored an active session, clean up any scheduled sessions
          localStorage.removeItem('sentinel_scheduled_session');
          return;
        }
      } catch (err) {}

      // If no active session, check for scheduled session in localStorage
      const savedScheduled = localStorage.getItem('sentinel_scheduled_session');
      if (savedScheduled) {
        try {
          const { form: savedForm, scheduleStartAt: savedStartAt, lecturerId: savedLecturerId } = JSON.parse(savedScheduled);
          const currentUserId = authData.user.id || authData.user._id;
          
          if (savedLecturerId === currentUserId) {
            const now = Date.now();
            const endMs = parseDateTime(savedForm.date, savedForm.endTime);
            
            if (isNaN(endMs) || endMs <= now) {
              // Scheduled session has already finished entirely, clear it
              localStorage.removeItem('sentinel_scheduled_session');
            } else if (now >= savedStartAt) {
              // Start time has already passed while away, generate QR immediately
              localStorage.removeItem('sentinel_scheduled_session');
              setForm(savedForm);
              await doGenerateQR(savedForm);
            } else {
              // Still in future, restore scheduled countdown state
              setForm(savedForm);
              setScheduleStartAt(savedStartAt);
              setScheduleMode("scheduled");
            }
          }
        } catch (e) {
          localStorage.removeItem('sentinel_scheduled_session');
        }
      }
    };

    fetchSession();
  }, [authData?.user, doGenerateQR]);

  // Session expiry countdown
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
      setTimeLeft(formatMs(diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);


  // ── Scheduled countdown runner ──
  useEffect(() => {
    if (scheduleMode !== "scheduled" || !scheduleStartAt) return;

    const tick = () => {
      const diff = scheduleStartAt - Date.now();
      if (diff <= 0) {
        if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
        setScheduleMode("idle");
        setScheduleStartAt(null);
        setScheduleCountdown("");
        localStorage.removeItem('sentinel_scheduled_session');
        toast.info("Session start time reached — generating QR now…");
        doGenerateQR();
        return;
      }
      setScheduleCountdown(formatMs(diff));
    };

    tick();
    scheduleTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
    };
  }, [scheduleMode, scheduleStartAt, doGenerateQR]);

  const handleCancelSchedule = () => {
    if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
    setScheduleMode("idle");
    setScheduleStartAt(null);
    setScheduleCountdown("");
    localStorage.removeItem('sentinel_scheduled_session');
    toast.info("Scheduled session cancelled.");
  };

  const handleEndSession = async () => {
    setIsEndingSession(true);
    try {
      await fetchAPI('/api/end-session', { method: 'DELETE' });
      toast.success("Session ended successfully.");
    } catch(err: any) {
      toast.error(err.message || "Failed to end session on server.");
    } finally {
      setQrCode(null);
      setActiveSessionId(null);
      setExpiresAt(null);
      setTimeLeft("");
      setIsEndingSession(false);
      localStorage.removeItem('sentinel_scheduled_session');
    }
  };

  // ── Form submission logic ──
  const handleGenerateQR = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.startTime || !form.endTime || !form.date) {
      toast.error("Please fill in all fields including start and end times.");
      return;
    }

    const now = Date.now();
    const startMs = parseDateTime(form.date, form.startTime);
    let endMs = parseDateTime(form.date, form.endTime);

    if (isNaN(startMs) || isNaN(endMs)) {
      toast.error("Please enter valid start and end times.");
      return;
    }

    // Support overnight sessions: if end time is before or equal to start time, add 24 hours to end time
    if (endMs <= startMs) {
      endMs += 24 * 60 * 60 * 1000;
    }

    if (endMs <= now) {
      toast.error("End time must be in the future.");
      return;
    }

    const bufferMs = 60_000; // 1-minute buffer before treating as "future"

    if (startMs > now + bufferMs) {
      setScheduleStartAt(startMs);
      setScheduleMode("scheduled");
      
      // Save scheduled session to localStorage
      if (authData?.user) {
        localStorage.setItem('sentinel_scheduled_session', JSON.stringify({
          form,
          scheduleStartAt: startMs,
          lecturerId: authData.user.id || authData.user._id
        }));
      }
      
      const minutesUntil = Math.ceil((startMs - now) / 60_000);
      toast.success(`Session scheduled! QR will generate in ~${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}.`);
    } else {
      await doGenerateQR();
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

            {/* ── SCHEDULED MODE ── */}
            {scheduleMode === "scheduled" && !qrCode && (
              <div className="text-center w-full flex flex-col items-center max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                  <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                    <CalendarClock className="size-10 text-primary" />
                  </div>
                </div>

                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  Session Scheduled
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">QR generates in</h2>

                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-10 py-6">
                  <div className="font-mono text-6xl font-bold tracking-tight text-primary tabular-nums">
                    {scheduleCountdown}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">hours : minutes : seconds</div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-left w-full">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Course</div>
                    <div className="mt-1 font-semibold truncate">{form.courseTitle || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Hall</div>
                    <div className="mt-1 font-semibold">{form.hall || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Starts at</div>
                    <div className="mt-1 font-semibold font-mono">{form.startTime}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Ends at</div>
                    <div className="mt-1 font-semibold font-mono">{form.endTime}</div>
                  </div>
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  The QR code will be generated automatically when the session start time is reached.
                  You can stay on this page or come back — it will work either way.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    onClick={async () => {
                      if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
                      setScheduleMode("idle");
                      setScheduleStartAt(null);
                      setScheduleCountdown("");
                      localStorage.removeItem('sentinel_scheduled_session');
                      toast.info("Starting scheduled session immediately...");
                      await doGenerateQR();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
                  >
                    <Play className="size-4" /> Start Session Now
                  </button>
                  <button
                    onClick={handleCancelSchedule}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <X className="size-4" /> Cancel Scheduled Session
                  </button>
                </div>
              </div>
            )}

            {/* ── ACTIVE QR MODE ── */}
            {qrCode && (
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
                    <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> Time Remaining
                    </div>
                    <div className="mt-1 font-semibold text-primary font-mono">{timeLeft || "Computing..."}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-glow)] inline-block">
                  <img src={qrCode} alt="Scan to mark attendance" className="w-[400px] h-[400px]" />
                </div>

                <div className="mt-10 flex justify-center gap-4">
                  <button onClick={() => doGenerateQR()} disabled={isGenerating || isEndingSession} className="inline-flex items-center gap-2 rounded-md border border-border bg-card/80 px-6 py-3 text-sm font-semibold transition-colors hover:bg-card disabled:opacity-50">
                    <Play className="size-4" /> {isGenerating ? "Regenerating..." : "Regenerate QR"}
                  </button>
                  <button onClick={handleEndSession} disabled={isEndingSession} className="inline-flex items-center gap-2 rounded-md bg-destructive/15 px-6 py-3 text-sm font-semibold text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/25 disabled:opacity-50">
                    <Square className="size-4" /> {isEndingSession ? "Ending Session..." : "End Session"}
                  </button>
                </div>
              </div>
            )}

            {/* ── FORM MODE ── */}
            {!qrCode && scheduleMode === "idle" && (
              <div className="max-w-md w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold tracking-tight">Configure New Session</h2>
                  <p className="mt-2 text-muted-foreground">
                    Enter the details for this class session before generating the QR code.
                  </p>
                  <p className="mt-1 text-xs text-primary/80">
                    💡 If start time is in the future, the QR will be scheduled and generated automatically.
                  </p>
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

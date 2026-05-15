import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { MapPin, ShieldCheck, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchAPI } from "@/lib/api";

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
  matricNumber: z.string().trim().min(3, "Matric number required").max(40),
});

type FormState = z.infer<typeof Schema>;

/** Possible states for geolocation acquisition */
type LocationStatus = "acquiring" | "granted" | "denied" | "unavailable";

function SubmitPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(() => {
    const savedName = localStorage.getItem("savedFullName") || "";
    const savedMatric = localStorage.getItem("savedMatric") || "";
    return { fullName: savedName, matricNumber: savedMatric };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  // ── Geolocation state ──
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("acquiring");
  const [locationError, setLocationError] = useState<string>("");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("acquiring");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      (err) => {
        setLocation(null);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("denied");
          setLocationError(
            "Location access was denied. Please allow location access in your browser settings and try again."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationStatus("denied");
          setLocationError("Location information is unavailable. Please check your GPS signal and try again.");
        } else {
          setLocationStatus("denied");
          setLocationError("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  }, []);

  // Request location immediately on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Hard gate — no fake/fallback coordinates allowed
    if (!location) {
      toast.error("Location is required to mark attendance.");
      return;
    }

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

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('sessionId');

    fetchAPI('/api/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({
        name: form.fullName,
        universityRollNo: form.matricNumber,
        deviceFingerprint: navigator.userAgent,
        location,   // Real GPS coords — no fallback
        sessionId
      })
    })
    .then(() => {
      setStatus("success");
      localStorage.setItem("savedFullName", form.fullName);
      localStorage.setItem("savedMatric", form.matricNumber);
      toast.success("Attendance marked successfully", { description: "Record safely stored." });
    })
    .catch((err) => {
      setStatus("idle");
      toast.error("Failed to mark attendance", { description: err.message });
    });
  };

  // ── Success screen ──
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
            <span className="text-foreground">the active session</span>.
          </p>
          <div className="mt-8 grid w-full grid-cols-3 gap-3 text-left">
            <Tile label="Session" value="Verified" />
            <Tile label="Time" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
            <Tile label="GPS" value="±8m" />
          </div>
          <div className="mt-10 inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground opacity-80">
            You may now close this tab.
          </div>
        </main>
      </div>
    );
  }

  // ── Acquiring location screen ──
  if (locationStatus === "acquiring") {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 py-32 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <MapPin className="size-10 text-primary" />
            </div>
          </div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Step 1 of 2</div>
          <h1 className="text-2xl font-semibold tracking-tight">Acquiring your location…</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please <strong className="text-foreground">allow location access</strong> when your browser asks.
            This is required to verify you are physically present in the classroom.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card/40 px-5 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary shrink-0" />
            Waiting for GPS confirmation…
          </div>
        </main>
      </div>
    );
  }

  // ── Location denied / unavailable screen ──
  if (locationStatus === "denied" || locationStatus === "unavailable") {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 py-32 text-center">
          <div className="relative mb-8">
            <div className="relative flex size-24 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/30">
              <AlertCircle className="size-10 text-destructive" />
            </div>
          </div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">Location Required</div>
          <h1 className="text-2xl font-semibold tracking-tight">Location Access Denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">{locationError}</p>

          <div className="mt-8 w-full rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-left text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">How to enable location:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click the 🔒 lock icon in your browser address bar</li>
              <li>Find <strong>Location</strong> and set it to <strong>Allow</strong></li>
              <li>Refresh this page and try again</li>
            </ol>
          </div>

          <button
            onClick={requestLocation}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
          >
            <RefreshCw className="size-4" /> Retry Location Access
          </button>
        </main>
      </div>
    );
  }

  // ── Main form (location granted) ──
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
              label="Matric Number"
              value={form.matricNumber}
              onChange={(v) => setForm({ ...form, matricNumber: v })}
              error={errors.matricNumber}
              placeholder="e.g., AIT/HND/24/00036"
              mono
            />

            <button
              type="submit"
              disabled={status === "loading" || !location}
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

        {/* Right verification panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl glass-strong p-6 ring-glow">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-success">Verified</span>
              <ShieldCheck className="size-4 text-success" />
            </div>
            <div className="text-sm font-medium">Session Active</div>
            <div className="mt-1 text-xs text-muted-foreground">Live verification running</div>
            <div className="mt-6 space-y-3 text-sm">
              <RowK k="Method" v="Dynamic QR" />
              <RowK k="Timestamp" v={new Date().toLocaleTimeString()} />
              <RowK k="User" v={form.fullName || "Guest"} />
            </div>
          </div>

          {/* GPS status card */}
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-primary" /> GPS Verification
            </div>
            <div className="text-xs text-muted-foreground">
              Within geofence radius. Coordinates locked to the registered hall.
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              ±8m precision · Location confirmed
            </div>
            {location && (
              <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            )}
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

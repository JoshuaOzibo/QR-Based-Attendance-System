import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { LiveQrCard } from "@/components/live-qr-card";
import {
  ArrowRight,
  ScanLine,
  ShieldCheck,
  MapPin,
  Activity,
  Lock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel.edu — Smart QR Attendance for Universities" },
      {
        name: "description",
        content:
          "Dynamic 90-second QR sessions, geolocation verification, and real-time attendance analytics. Enterprise-grade attendance for universities.",
      },
      { property: "og:title", content: "Sentinel.edu — Smart QR Attendance" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-32 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[140px]" />
          <div className="absolute -bottom-24 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-chart-5/10 blur-[120px]" />

          <div className="mx-auto grid max-w-7xl gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="animate-float-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Active Session · CS-402 Systems Architecture
                </span>
              </div>
              <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Dynamic verification for the <span className="text-gradient">modern university</span>.
              </h1>
              <p className="mt-6 max-w-[58ch] text-pretty text-lg leading-relaxed text-muted-foreground">
                Eliminate manual roll calls with rolling cryptographic QR sessions, real-time geolocation
                fencing, and on-device fraud detection. Built for institutions that take attendance integrity
                seriously.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
                >
                  <Lock className="size-4" /> Sign In to Sentinel
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6 text-xs text-muted-foreground">
                <Trust icon={<Lock className="size-3.5" />} label="AES-256 Sessions" />
                <Trust icon={<MapPin className="size-3.5" />} label="GPS Geofenced" />
                <Trust icon={<Activity className="size-3.5" />} label="Real-time" />
              </div>
            </div>

            <div className="animate-float-up [animation-delay:120ms]">
              <LiveQrCard />
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Why Sentinel
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Engineered against every shortcut students invent.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<ScanLine className="size-5" />}
              title="Rolling 90-second QR"
              body="Cryptographic session keys regenerate every 90 seconds, making screenshots and screen-shares useless within minutes."
            />
            <Feature
              icon={<MapPin className="size-5" />}
              title="Geolocation fencing"
              body="Submissions are validated against the registered classroom radius — proxy attendance fails at the network edge."
            />
            <Feature
              icon={<ShieldCheck className="size-5" />}
              title="Duplicate prevention"
              body="One device, one roll number, one session. Multi-factor binding flags duplicate signals instantly."
            />
            <Feature
              icon={<Activity className="size-5" />}
              title="Real-time analytics"
              body="Faculty see attendance materialize live — heatmaps, trends, and threshold alerts in a single canvas."
            />
            <Feature
              icon={<Lock className="size-5" />}
              title="Session validation"
              body="Every scan is HMAC-signed and bound to a server-issued session token before entering the ledger."
            />
            <Feature
              icon={<Sparkles className="size-5" />}
              title="Smart insights"
              body="Predictive thresholds tell students exactly how many classes they need to stay above 75%."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border glass-strong p-12">
            <div className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ready to mark your first secure session?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the live scanner and verify a classroom in under 30 seconds.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background"
                >
                  <Lock className="size-4" /> Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-background/40 p-8 transition-colors hover:bg-card/40">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      {label}
    </div>
  );
}

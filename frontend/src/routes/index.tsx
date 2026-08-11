import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { useEffect } from "react";
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
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-32 right-0 -z-10 h-[300px] min-[400px]:h-[400px] sm:h-[600px] w-[300px] min-[400px]:w-[400px] sm:w-[600px] rounded-full bg-primary/15 blur-[90px] sm:blur-[140px]" />
          <div className="absolute -bottom-24 left-0 -z-10 h-[280px] min-[400px]:h-[350px] sm:h-[500px] w-[280px] min-[400px]:w-[350px] sm:w-[500px] rounded-full bg-chart-5/10 blur-[80px] sm:blur-[120px]" />

          <div className="mx-auto grid max-w-7xl gap-10 sm:gap-14 lg:gap-16 px-4 sm:px-6 pt-8 sm:pt-16 lg:pt-20 pb-12 sm:pb-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="animate-float-up text-center flex flex-col items-center lg:text-left lg:items-start">
              <div className="mb-4 sm:mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-3.5">
                <span className="size-2 animate-pulse rounded-full bg-primary shrink-0" />
                <span className="text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-primary truncate">
                  Active Session · CS-402 Systems Architecture
                </span>
              </div>

              <h1 className="text-balance text-2xl min-[360px]:text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-center lg:text-left">
                Dynamic verification for the <span className="text-gradient">modern university</span>.
              </h1>

              <p className="mt-4 sm:mt-6 max-w-[58ch] text-balance text-xs min-[360px]:text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground text-center lg:text-left">
                Eliminate manual roll calls with rolling cryptographic QR sessions, real-time geolocation
                fencing, and on-device fraud detection. Built for institutions that take attendance integrity
                seriously.
              </p>

              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 w-full max-w-xs sm:max-w-none">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Lock className="size-4" /> Sign In to Sentinel
                </Link>
              </div>

              <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-muted-foreground border-t border-border/40 pt-6 w-full">
                <Trust icon={<Lock className="size-3.5 text-primary" />} label="AES-256 Sessions" />
                <Trust icon={<MapPin className="size-3.5 text-primary" />} label="GPS Geofenced" />
                <Trust icon={<Activity className="size-3.5 text-primary" />} label="Real-time" />
              </div>
            </div>

            <div className="animate-float-up [animation-delay:120ms] w-full flex justify-center">
              <LiveQrCard />
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20">
          <div className="mb-8 sm:mb-12 max-w-2xl text-center mx-auto lg:text-left lg:mx-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Why Sentinel
            </div>
            <h2 className="mt-3 text-xl min-[360px]:text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
              Engineered against every shortcut students invent.
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border glass-strong p-6 sm:p-10 lg:p-12 text-center md:text-left">
            <div className="absolute -right-20 -top-20 -z-10 size-60 sm:size-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-center">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
                  Ready to mark your first secure session?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  Open the live scanner and verify a classroom in under 30 seconds.
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-center md:justify-start">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
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
    <div className="bg-background/40 p-6 sm:p-8 transition-colors hover:bg-card/40 rounded-2xl border border-border/40 flex flex-col items-center text-center lg:items-start lg:text-left">
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

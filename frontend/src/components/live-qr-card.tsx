import { useEffect, useState } from "react";
import { QrPattern } from "./qr-pattern";
import { MapPin, Wifi, ScanLine } from "lucide-react";

const SESSION_LENGTH = 90;

export function LiveQrCard() {
  const [remaining, setRemaining] = useState(SESSION_LENGTH);
  const [seed, setSeed] = useState(() => "sec-" + Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setSeed("sec-" + Date.now());
          return SESSION_LENGTH;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const progress = remaining / SESSION_LENGTH;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl glass-strong p-5 sm:p-8 md:p-10 ring-glow w-full max-w-[400px] mx-auto overflow-hidden">
      {/* Header Info */}
      <div className="flex w-full items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="size-2 animate-pulse rounded-full bg-success" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-success">
            Live Session
          </span>
        </div>
        <div className="font-mono text-[9px] min-[380px]:text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          #SEC-8829-01
        </div>
      </div>

      <div className="relative my-3 size-[230px] min-[380px]:size-[270px] sm:size-[310px] flex items-center justify-center">
        {/* Countdown ring */}
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            className="stroke-border"
            strokeWidth="3"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.18 265)" />
              <stop offset="100%" stopColor="oklch(0.55 0.22 265)" />
            </linearGradient>
          </defs>
        </svg>

        {/* QR */}
        <div className="absolute inset-6 min-[380px]:inset-8 sm:inset-9 overflow-hidden rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xl">
          <div key={seed} className="relative h-full w-full animate-float-up">
            <QrPattern seed={seed} />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="animate-scan absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_3px_oklch(0.62_0.21_265/0.7)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 text-center">
        <div className="font-mono text-3xl sm:text-4xl font-medium tracking-tight tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Refreshing session keys in {remaining}s
        </p>
      </div>

      <div className="mt-6 grid w-full grid-cols-3 border-t border-border pt-4 sm:pt-6 gap-1">
        <Stat icon={<MapPin className="size-3.5 shrink-0" />} label="Location" value="Hall B-12" />
        <Stat
          icon={<Wifi className="size-3.5 shrink-0" />}
          label="GPS"
          value="Verified"
          accent
          divider
        />
        <Stat icon={<ScanLine className="size-3.5 shrink-0" />} label="Scanned" value="42 / 60" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  divider,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`px-1 text-center ${divider ? "border-x border-border" : ""}`}>
      <div className="mb-1 flex items-center justify-center gap-1 text-[9px] min-[380px]:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-[11px] min-[380px]:text-xs font-medium truncate ${accent ? "text-success" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "neutral" | "warning";
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, delta, deltaTone = "positive", icon: Icon, children }: KpiCardProps) {
  const tone =
    deltaTone === "positive" ? "text-success" : deltaTone === "warning" ? "text-warning" : "text-muted-foreground";
  return (
    <div className="rounded-2xl glass p-6 ring-1 ring-white/5 transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5 text-primary" />}
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {delta && <div className={`mt-2 text-[11px] font-medium ${tone}`}>{delta}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "green",
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "green" | "blue";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "blue" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

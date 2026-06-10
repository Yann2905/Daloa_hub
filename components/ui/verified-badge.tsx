import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Badge "verifie / certifie" (boutique certifiee, equipe officielle). */
export function VerifiedBadge({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-primary", className)}
      title={label ?? "Certifie par DALOA HUB"}
    >
      <BadgeCheck className="size-4 fill-primary/15" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </span>
  );
}

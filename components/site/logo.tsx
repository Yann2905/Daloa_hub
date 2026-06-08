import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-green text-sm font-bold text-white">
        DH
      </span>
      <span className="text-lg font-bold tracking-tight text-brand-dark">
        DALOA <span className="text-brand-green">HUB</span>
      </span>
    </Link>
  );
}

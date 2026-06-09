"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination par liens (conserve les autres parametres d'URL).
 * Affiche "Page X / Y" avec precedent / suivant.
 */
export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  };

  const btn =
    "flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors";

  return (
    <nav className="flex items-center justify-center gap-3 pt-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(btn, "hover:border-primary hover:text-primary")}>
          <ChevronLeft className="size-4" /> Precedent
        </Link>
      ) : (
        <span className={cn(btn, "cursor-not-allowed opacity-50")}>
          <ChevronLeft className="size-4" /> Precedent
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(btn, "hover:border-primary hover:text-primary")}>
          Suivant <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(btn, "cursor-not-allowed opacity-50")}>
          Suivant <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

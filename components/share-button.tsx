"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Partage natif (mobile) avec repli WhatsApp. Utilise l'URL de la page courante. */
export function ShareButton({
  text,
  label = "Partager",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch {
        /* annule : on tente WhatsApp */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full border bg-card px-4 text-sm font-medium transition hover:border-primary hover:text-primary active:scale-95",
        className,
      )}
    >
      <Share2 className="size-4" /> {label}
    </button>
  );
}

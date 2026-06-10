"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interrupteur Mode sombre (pour la page Compte). */
export function ThemeSwitch() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function set(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft">
      <span className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
          <Moon className="size-5" />
        </span>
        <span>
          <span className="block font-medium">Mode sombre</span>
          <span className="block text-xs text-muted-foreground">Theme clair ou sombre</span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={() => set(!dark)}
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
          dark ? "justify-end bg-primary" : "justify-start bg-input",
        )}
      >
        <span className="size-6 rounded-full bg-white shadow transition-all" />
      </button>
    </div>
  );
}

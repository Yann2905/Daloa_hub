"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id" | "variant"> & { variant?: ToastVariant }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback<ToastContextValue["toast"]>((t) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, variant: "default", ...t }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-3 safe-top">
        {items.map((i) => (
          <div
            key={i.id}
            className={cn(
              "animate-in pointer-events-auto w-full max-w-sm rounded-xl border bg-card p-3.5 shadow-card",
              i.variant === "success" && "border-l-4 border-l-brand-green",
              i.variant === "error" && "border-l-4 border-l-destructive",
            )}
          >
            <p className="text-sm font-semibold">{i.title}</p>
            {i.description && (
              <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit etre utilise dans ToastProvider");
  return ctx;
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Headset, Loader2 } from "lucide-react";
import { getOrCreateSupportThread } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function SupportButton({ className }: { className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  function go() {
    start(async () => {
      const res = await getOrCreateSupportThread();
      if (res.error || !res.id) return toast({ title: res.error ?? "Erreur", variant: "error" });
      router.push(`/messages/${res.id}`);
    });
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-soft transition hover:border-primary/40 hover:shadow-card",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-orange text-white">
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Headset className="size-5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">Service client</span>
        <span className="block truncate text-xs text-muted-foreground">
          Une question ? L&apos;assistant DALOA HUB vous repond tout de suite.
        </span>
      </span>
    </button>
  );
}

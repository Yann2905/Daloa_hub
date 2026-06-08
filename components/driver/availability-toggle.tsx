"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setAvailability, updatePosition } from "@/lib/actions/driver";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const { toast } = useToast();
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  // Lorsque le livreur est en ligne, on transmet sa position regulierement.
  useEffect(() => {
    if (!on || !navigator.geolocation) return;
    const send = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true },
      );
    send();
    const id = setInterval(send, 30000); // toutes les 30s
    return () => clearInterval(id);
  }, [on]);

  function toggle() {
    const next = !on;
    startTransition(async () => {
      // Capture la position au moment de passer en ligne
      if (next && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) =>
          updatePosition(pos.coords.latitude, pos.coords.longitude),
        );
      }
      const res = await setAvailability(next);
      if (res.error) {
        toast({ title: res.error, variant: "error" });
        return;
      }
      setOn(next);
      toast({ title: next ? "Vous etes en ligne" : "Vous etes hors ligne", variant: "success" });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border p-4 transition-colors",
        on ? "border-brand-green bg-brand-green/10" : "bg-card",
      )}
    >
      <div className="text-left">
        <p className="font-semibold">{on ? "En ligne" : "Hors ligne"}</p>
        <p className="text-sm text-muted-foreground">
          {on ? "Vous recevez des livraisons" : "Activez pour recevoir des courses"}
        </p>
      </div>
      <span className={cn("relative h-7 w-12 rounded-full transition-colors", on ? "bg-brand-green" : "bg-muted")}>
        {pending ? (
          <Loader2 className="absolute left-1 top-1 size-5 animate-spin text-white" />
        ) : (
          <span
            className={cn(
              "absolute top-1 size-5 rounded-full bg-white transition-all",
              on ? "left-6" : "left-1",
            )}
          />
        )}
      </span>
    </button>
  );
}

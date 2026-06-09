"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

/**
 * Icone Messages avec badge de non-lus (sondage) + son quand un nouveau
 * message arrive (augmentation du compteur).
 */
export function MessagesLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  const prevRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 680;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {
      /* audio indisponible */
    }
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/messages/unread", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!active) return;
        const c = d.count ?? 0;
        if (prevRef.current !== null && c > prevRef.current) beep();
        prevRef.current = c;
        setCount(c);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Link href="/messages" className={className ?? "relative rounded-md p-2 hover:bg-secondary"} aria-label="Messages">
      <MessageCircle className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

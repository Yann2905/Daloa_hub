"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Grid3x3, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Accueil", icon: Home, exact: true },
  { href: "/produits", label: "Produits", icon: Grid3x3 },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle, badge: true },
  { href: "/compte", label: "Compte", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
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
        setUnread(c);
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
    <nav className="sticky bottom-0 z-40 border-t bg-card safe-bottom md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-brand-green" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.badge && unread > 0 && (
                  <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

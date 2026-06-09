"use client";

import { useEffect } from "react";
import { registerPush, isPushConfigured } from "@/lib/firebase-client";

/**
 * Re-enregistre SILENCIEUSEMENT le token push si la permission est DEJA
 * accordee (pas de demande automatique : ca se fait via un bouton, geste
 * utilisateur requis par les navigateurs, surtout iOS).
 */
export function PushRegister() {
  useEffect(() => {
    if (!isPushConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/messages/unread", { cache: "no-store" });
        if (!r.ok || cancelled) return; // non connecte
        registerPush();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

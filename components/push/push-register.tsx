"use client";

import { useEffect } from "react";
import { registerPush, isPushConfigured } from "@/lib/firebase-client";

/**
 * Enregistre les notifications push pour un utilisateur authentifie.
 * A monter dans des contextes connectes (dashboards, messages, compte).
 */
export function PushRegister() {
  useEffect(() => {
    if (!isPushConfigured()) return;
    // Leger delai : laisse l'app s'hydrater avant la demande de permission.
    const t = setTimeout(() => {
      registerPush();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}

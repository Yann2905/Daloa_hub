"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker PWA cote client (apres hydratation).
 * Silencieux en cas d'echec pour ne pas degrader l'experience.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* enregistrement best-effort */
        });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker PWA et gere la MISE A JOUR AUTOMATIQUE :
 * - verifie regulierement une nouvelle version
 * - recharge l'app une fois quand le nouveau service worker prend le controle
 * Ainsi les utilisateurs voient les changements sans vider le cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.update();
          // Verifie une nouvelle version toutes les 60 s
          setInterval(() => reg.update(), 60 * 1000);
        })
        .catch(() => {
          /* best-effort */
        });
    };

    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraichit periodiquement les donnees de la page (Server Components) sans
 * rechargement complet : appelle router.refresh() toutes les `seconds`.
 * Se met en pause quand l'onglet est en arriere-plan (economie batterie/data).
 */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    let id: ReturnType<typeof setInterval>;

    const start = () => {
      stop();
      id = setInterval(() => {
        if (document.visibilityState === "visible") router.refresh();
      }, seconds * 1000);
    };
    const stop = () => id && clearInterval(id);

    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", start);
    };
  }, [router, seconds]);

  return null;
}

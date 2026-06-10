"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toggleFavorite } from "@/lib/actions/favorites";

interface FavCtx {
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<{ error?: string; favorited?: boolean }>;
}

const Ctx = createContext<FavCtx>({ has: () => false, toggle: async () => ({}) });

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favorites", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d.ids) && setIds(new Set(d.ids)))
      .catch(() => {});
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(async (id: string) => {
    // Optimiste
    setIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    const res = await toggleFavorite(id);
    if (res.error || typeof res.favorited === "boolean") {
      setIds((prev) => {
        const n = new Set(prev);
        if (res.error) {
          // revert : remet l'etat d'avant le clic optimiste
          if (n.has(id)) n.delete(id);
          else n.add(id);
        } else if (res.favorited) n.add(id);
        else n.delete(id);
        return n;
      });
    }
    return res;
  }, []);

  return <Ctx.Provider value={{ has, toggle }}>{children}</Ctx.Provider>;
}

export const useFavorites = () => useContext(Ctx);

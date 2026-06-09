"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const activeCat = params.get("categorie") ?? "";

  const apply = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      next.delete("page");
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== search) apply({ q: search });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="sticky top-16 z-20 space-y-3 rounded-2xl border bg-card/90 p-3 shadow-soft backdrop-blur">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-xl pl-10 text-base"
        />
      </div>

      {/* Puces de categories */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {[{ slug: "", label: "Tout" }, ...CATEGORIES].map((c) => {
          const active = activeCat === c.slug;
          return (
            <button
              key={c.slug || "all"}
              type="button"
              onClick={() => apply({ categorie: c.slug })}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all active:scale-95",
                active
                  ? "border-transparent bg-gradient-to-r from-brand-green to-emerald-600 text-white shadow-soft"
                  : "hover:border-primary/40 hover:text-primary",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Select value={params.get("tri") ?? "recent"} onChange={(e) => apply({ tri: e.target.value })}>
          <option value="recent">Plus recents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix decroissant</option>
        </Select>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Prix max (FCFA)"
          defaultValue={params.get("max") ?? ""}
          onBlur={(e) => apply({ max: e.target.value })}
        />
        <Select value={params.get("dispo") ?? ""} onChange={(e) => apply({ dispo: e.target.value })}>
          <option value="">Disponibilite</option>
          <option value="1">En stock uniquement</option>
        </Select>
      </div>
    </div>
  );
}

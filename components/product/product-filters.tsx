"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
    <div className="space-y-3 rounded-2xl border bg-card p-3 shadow-soft">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-xl pl-10 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select value={activeCat} onChange={(e) => apply({ categorie: e.target.value })}>
          <option value="">Toutes les categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
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

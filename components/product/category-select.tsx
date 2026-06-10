"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { Select } from "@/components/ui/select";

/** Menu deroulant des categories : redirige vers le catalogue filtre. */
export function CategorySelect() {
  const router = useRouter();
  return (
    <Select
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) router.push(`/produits?categorie=${e.target.value}`);
      }}
      className="h-12 max-w-md rounded-xl text-base"
    >
      <option value="">Choisir une categorie...</option>
      {CATEGORIES.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.label}
        </option>
      ))}
    </Select>
  );
}

"use client";

import { useState } from "react";
import { AddToCart } from "./add-to-cart";
import type { CartLine } from "@/lib/cart/cart-context";
import type { ProductOption } from "@/lib/database.types";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de variantes (taille, couleur...) + ajout au panier.
 * Le client doit choisir chaque option avant de pouvoir ajouter.
 */
export function BuyBox({
  line,
  options,
}: {
  line: Omit<CartLine, "quantity" | "variant">;
  options: ProductOption[];
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const allChosen = options.every((o) => selected[o.name]);
  const variant = options.length
    ? options.map((o) => `${o.name}: ${selected[o.name]}`).join(", ")
    : undefined;

  return (
    <div className="space-y-4">
      {options.map((o) => (
        <div key={o.name} className="space-y-1.5">
          <p className="text-sm font-medium">{o.name}</p>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [o.name]: v }))}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95",
                  selected[o.name] === v
                    ? "border-transparent bg-gradient-to-r from-brand-green to-emerald-600 text-white shadow-soft"
                    : "hover:border-primary hover:text-primary",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      {options.length > 0 && !allChosen && (
        <p className="text-xs text-accent">
          Choisissez {options.filter((o) => !selected[o.name]).map((o) => o.name.toLowerCase()).join(", ")} pour continuer.
        </p>
      )}

      <AddToCart
        line={{ ...line, variant: allChosen ? variant : null }}
        disabled={options.length > 0 && !allChosen}
      />
    </div>
  );
}

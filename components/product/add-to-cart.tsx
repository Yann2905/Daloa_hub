"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart, type CartLine } from "@/lib/cart/cart-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function AddToCart({
  line,
  disabled = false,
}: {
  line: Omit<CartLine, "quantity">;
  disabled?: boolean;
}) {
  const { add, vendorId, lines } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = line.stock <= 0;

  const differentVendor =
    vendorId != null && vendorId !== line.vendorId && lines.length > 0;

  function handleAdd() {
    if (differentVendor) {
      // Cas rare et important : on garde une alerte (en haut)
      toast({
        title: "Un seul vendeur par commande",
        description:
          "Videz ou validez d'abord votre panier (articles d'une autre boutique).",
        variant: "error",
      });
      return;
    }
    add(line, qty);
    // Feedback INSTANTANE sur le bouton, sans message intrusif
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  if (outOfStock) {
    return (
      <Button disabled className="w-full" size="lg">
        Rupture de stock
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="p-3 active:scale-90"
          aria-label="Diminuer"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(line.stock, q + 1))}
          className="p-3 active:scale-90"
          aria-label="Augmenter"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={handleAdd} disabled={disabled} className="flex-1" size="lg" variant={added ? "accent" : "default"}>
        {added ? (
          <>
            <Check className="size-4" /> Ajoute au panier
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" /> Ajouter au panier
          </>
        )}
      </Button>
    </div>
  );
}

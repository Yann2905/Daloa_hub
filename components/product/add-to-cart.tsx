"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart, type CartLine } from "@/lib/cart/cart-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function AddToCart({ line }: { line: Omit<CartLine, "quantity"> }) {
  const { add, vendorId, lines } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const outOfStock = line.stock <= 0;

  const differentVendor =
    vendorId != null && vendorId !== line.vendorId && lines.length > 0;

  function handleAdd() {
    if (differentVendor) {
      toast({
        title: "Un seul vendeur par commande",
        description:
          "Votre panier contient deja des articles d'une autre boutique. Validez ou videz ce panier d'abord.",
        variant: "error",
      });
      return;
    }
    add(line, qty);
    toast({ title: "Ajoute au panier", description: line.name, variant: "success" });
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
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="p-3"
          aria-label="Diminuer"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(line.stock, q + 1))}
          className="p-3"
          aria-label="Augmenter"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={handleAdd} className="flex-1" size="lg">
        {differentVendor ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
        Ajouter au panier
      </Button>
    </div>
  );
}

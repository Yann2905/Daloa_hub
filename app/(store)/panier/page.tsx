"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, ImageOff } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { formatFcfa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { lines, setQty, remove, subtotal, count } = useCart();

  if (count === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <ShoppingCart className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Votre panier est vide</h1>
        <p className="text-sm text-muted-foreground">
          Parcourez les produits et ajoutez vos articles preferes.
        </p>
        <Button asChild>
          <Link href="/produits">Voir les produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container grid gap-6 py-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h1 className="text-2xl font-bold">Mon panier</h1>
        {lines.map((l) => (
          <div key={l.productId} className="flex gap-3 rounded-2xl border bg-card p-3 shadow-soft">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {l.imageUrl ? (
                <Image src={l.imageUrl} alt={l.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-5" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <p className="line-clamp-2 text-sm font-medium">{l.name}</p>
              <p className="bg-gradient-to-r from-brand-dark to-brand-green bg-clip-text text-sm font-bold text-transparent">{formatFcfa(l.unitPrice)}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center rounded-full border">
                  <button onClick={() => setQty(l.productId, l.quantity - 1)} className="p-2" aria-label="Diminuer">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{l.quantity}</span>
                  <button onClick={() => setQty(l.productId, l.quantity + 1)} className="p-2" aria-label="Augmenter">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(l.productId)}
                  className="p-2 text-destructive"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky top-20 h-fit space-y-3 rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold">Recapitulatif</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="font-medium">{formatFcfa(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-muted-foreground">Calculee a l&apos;etape suivante</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total (hors livraison)</span>
          <span>{formatFcfa(subtotal)}</span>
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/commande">Passer la commande</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, MessageCircle } from "lucide-react";
import { Logo } from "./logo";
import { useCart } from "@/lib/cart/cart-context";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="glass sticky top-0 z-40 border-b safe-top">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo />

        <Link
          href="/produits"
          className="mx-2 hidden max-w-md flex-1 items-center gap-2 rounded-full border bg-secondary/80 px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:shadow-soft sm:flex"
        >
          <Search className="size-4" />
          Rechercher un produit...
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/produits"
            className="rounded-md p-2 text-foreground hover:bg-secondary sm:hidden"
            aria-label="Rechercher"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/panier"
            className="relative rounded-md p-2 hover:bg-secondary"
            aria-label="Panier"
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/messages"
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Messages"
          >
            <MessageCircle className="size-5" />
          </Link>
          <Link
            href="/compte"
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Mon compte"
          >
            <User className="size-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

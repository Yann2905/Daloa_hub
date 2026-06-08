"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";

const items = [
  { href: "/", label: "Accueil", icon: Home, exact: true },
  { href: "/produits", label: "Produits", icon: Grid3x3 },
  { href: "/panier", label: "Panier", icon: ShoppingCart, cart: true },
  { href: "/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/compte", label: "Compte", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="sticky bottom-0 z-40 border-t bg-white safe-bottom md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-brand-green" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.cart && count > 0 && (
                  <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

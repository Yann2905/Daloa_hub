import { CartProvider } from "@/lib/cart/cart-context";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BottomNav } from "@/components/site/bottom-nav";
import { PushRegister } from "@/components/push/push-register";
import { FavoritesProvider } from "@/components/product/favorites-provider";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <PushRegister />
        <div className="flex min-h-dvh flex-col">
          <div className="bg-gradient-to-r from-brand-green via-emerald-600 to-brand-orange px-3 py-1.5 text-center text-xs font-medium text-white">
            Livraison rapide a Daloa · Paiement a la livraison · Negociez les prix en direct
          </div>
          <SiteHeader />
          <main className="bg-mesh flex-1 pb-4">{children}</main>
          <SiteFooter />
          <BottomNav />
        </div>
      </FavoritesProvider>
    </CartProvider>
  );
}

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
          <SiteHeader />
          <main className="bg-mesh flex-1 pb-4">{children}</main>
          <SiteFooter />
          <BottomNav />
        </div>
      </FavoritesProvider>
    </CartProvider>
  );
}

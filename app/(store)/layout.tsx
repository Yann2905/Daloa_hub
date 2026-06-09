import { CartProvider } from "@/lib/cart/cart-context";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BottomNav } from "@/components/site/bottom-nav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="bg-mesh flex-1 pb-4">{children}</main>
        <SiteFooter />
        <BottomNav />
      </div>
    </CartProvider>
  );
}

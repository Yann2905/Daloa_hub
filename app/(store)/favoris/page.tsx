import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listFavorites } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes favoris" };

export default async function FavorisPage() {
  const user = await requireUser();
  const products = await listFavorites(user.id);

  return (
    <div className="container space-y-5 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Heart className="size-6 text-red-500" /> Mes favoris
      </h1>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          <Heart className="size-10" />
          <p>Aucun favori pour le moment.</p>
          <Link href="/produits" className="text-sm font-semibold text-primary hover:underline">
            Parcourir les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

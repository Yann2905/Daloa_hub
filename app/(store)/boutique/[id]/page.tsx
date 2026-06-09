import { notFound } from "next/navigation";
import { Store, Star } from "lucide-react";
import { sql } from "@/lib/db";
import { listProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import type { Vendor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vendor] = await sql<Vendor[]>`
    select id, user_id, shop_name, description, logo_url, status, address,
           lat, lng, rating_avg::float8 as rating_avg, rating_count,
           created_at, updated_at
    from vendors where id = ${id} limit 1
  `;

  if (!vendor || vendor.status !== "approved") notFound();

  const { products } = await listProducts({ vendorId: id, pageSize: 48 });

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-green/10">
          <Store className="size-7 text-brand-green" />
        </span>
        <div>
          <h1 className="text-xl font-bold">{vendor.shop_name}</h1>
          {vendor.rating_count > 0 && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {vendor.rating_avg.toFixed(1)} ({vendor.rating_count} avis)
            </p>
          )}
          {vendor.address && <p className="text-sm text-muted-foreground">{vendor.address}</p>}
        </div>
      </div>

      {vendor.description && (
        <p className="text-sm text-muted-foreground">{vendor.description}</p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold">Produits ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground">Aucun produit disponible.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

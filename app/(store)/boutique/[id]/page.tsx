import Image from "next/image";
import { notFound } from "next/navigation";
import { Store, Star, Package, CalendarDays } from "lucide-react";
import { sql } from "@/lib/db";
import { listProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { NegotiateButton } from "@/components/chat/negotiate-button";
import { ShareButton } from "@/components/share-button";
import { initials } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { Vendor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

async function getShop(id: string) {
  const [vendor] = await sql<Vendor[]>`
    select id, user_id, shop_name, description, logo_url, status, address,
           lat, lng, delivers_self, self_delivery_fee, verified,
           rating_avg::float8 as rating_avg, rating_count, created_at, updated_at
    from vendors where id = ${id} limit 1
  `;
  return vendor ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getShop(id);
  if (!vendor) return { title: "Boutique introuvable" };
  const desc = vendor.description?.slice(0, 160) || `Decouvrez ${vendor.shop_name} sur DALOA HUB.`;
  return {
    title: vendor.shop_name,
    description: desc,
    openGraph: {
      title: vendor.shop_name,
      description: desc,
      images: vendor.logo_url ? [{ url: vendor.logo_url }] : [],
    },
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getShop(id);
  if (!vendor || vendor.status !== "approved") notFound();

  const { products, total } = await listProducts({ vendorId: id, pageSize: 48 });
  const memberSince = new Date(vendor.created_at).getFullYear();

  return (
    <div className="container space-y-6 py-6">
      {/* En-tete boutique */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <div className="bg-hero-animated h-28 sm:h-36" />
        <div className="-mt-12 px-5 pb-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {vendor.logo_url ? (
                <Image
                  src={vendor.logo_url}
                  alt={vendor.shop_name}
                  width={96}
                  height={96}
                  className="size-24 rounded-2xl border-4 border-card object-cover shadow-soft"
                />
              ) : (
                <span className="flex size-24 items-center justify-center rounded-2xl border-4 border-card bg-brand-gradient text-2xl font-bold text-white shadow-soft">
                  {initials(vendor.shop_name)}
                </span>
              )}
              <div className="pb-1">
                <h1 className="flex items-center gap-1.5 text-2xl font-bold tracking-tight">
                  {vendor.shop_name}
                  {vendor.verified && <VerifiedBadge label="Certifiee" className="text-base" />}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {vendor.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {vendor.rating_avg.toFixed(1)} ({vendor.rating_count})
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Package className="size-4" /> {total} produit{total > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-4" /> Depuis {memberSince}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <NegotiateButton vendorId={vendor.id} label="Contacter" />
              <ShareButton text={`Boutique ${vendor.shop_name} sur DALOA HUB`} />
            </div>
          </div>

          {vendor.description && (
            <p className="mt-4 text-sm text-muted-foreground">{vendor.description}</p>
          )}
          {vendor.address && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Store className="size-4" /> {vendor.address}
            </p>
          )}
        </div>
      </div>

      {/* Produits */}
      <div>
        <h2 className="mb-3 text-xl font-bold tracking-tight">Produits ({total})</h2>
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

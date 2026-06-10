import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Store } from "lucide-react";
import { getProduct } from "@/lib/queries/products";
import { formatFcfa } from "@/lib/utils";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { NegotiateButton } from "@/components/chat/negotiate-button";
import { Badge } from "@/components/ui/badge";
import type { CategorySlug } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const images = (product.product_images ?? []).sort(
    (a, b) => a.position - b.position,
  );
  const cover = images[0];

  return (
    <div className="container grid gap-8 py-6 md:grid-cols-2">
      {/* Galerie defilante */}
      <ProductGallery images={images} alt={product.name} />

      {/* Infos */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {product.categories && (
            <Badge variant="secondary">{product.categories.name}</Badge>
          )}
          {product.is_bulky && <Badge variant="outline">Livraison volumineuse</Badge>}
          {product.stock > 0 ? (
            <Badge variant="success">En stock ({product.stock})</Badge>
          ) : (
            <Badge variant="destructive">Rupture</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-gradient-to-r from-brand-dark to-brand-green bg-clip-text text-3xl font-extrabold text-transparent">
            {formatFcfa(product.price)}
          </span>
          {product.compare_at_price != null && product.compare_at_price > product.price && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatFcfa(product.compare_at_price)}
              </span>
              <span className="rounded-full bg-brand-orange px-2.5 py-1 text-sm font-bold text-white">
                -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
              </span>
            </>
          )}
          {product.rating_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {product.rating_avg.toFixed(1)} ({product.rating_count})
            </span>
          )}
        </div>

        {product.vendors && (
          <Link
            href={`/boutique/${product.vendors.id}`}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <Store className="size-4 text-primary" />
            {product.vendors.shop_name}
          </Link>
        )}

        {product.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <AddToCart
            line={{
              productId: product.id,
              vendorId: product.vendor_id,
              name: product.name,
              unitPrice: product.price,
              imageUrl: cover?.url ?? null,
              categorySlug: (product.categories?.slug as CategorySlug) ?? "mode",
              isBulky: product.is_bulky,
              stock: product.stock,
            }}
          />
          <NegotiateButton
            vendorId={product.vendor_id}
            productId={product.id}
            productName={product.name}
            price={product.price}
          />
        </div>
      </div>
    </div>
  );
}

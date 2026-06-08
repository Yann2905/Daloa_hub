import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Store, ImageOff } from "lucide-react";
import { getProduct } from "@/lib/queries/products";
import { formatFcfa } from "@/lib/utils";
import { AddToCart } from "@/components/product/add-to-cart";
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
      {/* Galerie */}
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-secondary">
          {cover ? (
            <Image
              src={cover.url}
              alt={product.name}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-10" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-md border bg-secondary"
              >
                <Image src={img.url} alt="" fill sizes="25vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

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

        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-brand-dark">
            {formatFcfa(product.price)}
          </span>
          {product.rating_count > 0 && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {product.rating_avg.toFixed(1)} ({product.rating_count})
            </span>
          )}
        </div>

        {product.vendors && (
          <Link
            href={`/boutique/${product.vendors.id}`}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:border-brand-green"
          >
            <Store className="size-4 text-brand-green" />
            {product.vendors.shop_name}
          </Link>
        )}

        {product.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="pt-2">
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
        </div>
      </div>
    </div>
  );
}

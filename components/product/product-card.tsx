import Link from "next/link";
import Image from "next/image";
import { Star, ImageOff } from "lucide-react";
import type { ProductWithImages } from "@/lib/database.types";
import { formatFcfa } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const img = product.product_images?.sort((a, b) => a.position - b.position)[0];
  const outOfStock = product.stock <= 0;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;
  const discount = onSale
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  return (
    <Link
      href={`/produits/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {img ? (
          <Image
            src={img.url}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        {/* Voile degrade en bas pour la lisibilite */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && (
            <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-white shadow-soft">
              -{discount}%
            </span>
          )}
          {outOfStock && <Badge variant="destructive">Rupture</Badge>}
          {product.is_bulky && <Badge variant="secondary">Volumineux</Badge>}
        </div>
        {product.rating_count > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold shadow-soft backdrop-blur">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {product.rating_avg.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
        {product.vendors && (
          <p className="truncate text-xs text-muted-foreground">{product.vendors.shop_name}</p>
        )}
        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          <span className="bg-gradient-to-r from-brand-dark to-brand-green bg-clip-text text-base font-extrabold text-transparent">
            {formatFcfa(product.price)}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatFcfa(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

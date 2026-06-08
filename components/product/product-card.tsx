import Link from "next/link";
import Image from "next/image";
import { Star, ImageOff } from "lucide-react";
import type { ProductWithImages } from "@/lib/database.types";
import { formatFcfa } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const img = product.product_images?.sort((a, b) => a.position - b.position)[0];
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/produits/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-secondary">
        {img ? (
          <Image
            src={img.url}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2">
            <Badge variant="destructive">Rupture</Badge>
          </span>
        )}
        {product.is_bulky && (
          <span className="absolute right-2 top-2">
            <Badge variant="secondary">Volumineux</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        {product.vendors && (
          <p className="text-xs text-muted-foreground">{product.vendors.shop_name}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-bold text-brand-dark">{formatFcfa(product.price)}</span>
          {product.rating_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {product.rating_avg.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

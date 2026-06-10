import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Store, BadgeCheck } from "lucide-react";
import { getProduct } from "@/lib/queries/products";
import { listProductReviews, getReviewEligibility } from "@/lib/queries/reviews";
import { getUser } from "@/lib/auth";
import { formatFcfa, formatDate, initials } from "@/lib/utils";
import { BuyBox } from "@/components/product/buy-box";
import { ProductGallery } from "@/components/product/product-gallery";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ReviewForm } from "@/components/product/review-form";
import { ShareButton } from "@/components/share-button";
import { NegotiateButton } from "@/components/chat/negotiate-button";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { CategorySlug } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Produit introuvable" };
  const img = product.product_images?.[0]?.url;
  const desc =
    product.description?.slice(0, 160) ||
    `${product.name} a ${formatFcfa(product.price)} sur DALOA HUB, la marketplace de Daloa.`;
  return {
    title: product.name,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      type: "website",
      images: img ? [{ url: img }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: img ? [img] : [],
    },
  };
}

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

  const user = await getUser();
  const reviews = await listProductReviews(id);
  const eligibility = user
    ? await getReviewEligibility(id, user.id)
    : { canReview: false, orderId: null };

  return (
    <div className="container space-y-10 py-6">
      <div className="grid gap-8 md:grid-cols-2">
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

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <ShareButton text={`${product.name} - ${formatFcfa(product.price)} sur DALOA HUB`} label="" className="size-11 px-0" />
            <FavoriteButton productId={product.id} className="size-11 border bg-card" iconClassName="size-5" />
          </div>
        </div>

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
            {product.vendors.verified && <VerifiedBadge />}
          </Link>
        )}

        {product.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <BuyBox
            options={product.options ?? []}
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

      {/* Avis clients */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Avis clients{reviews.length > 0 ? ` (${reviews.length})` : ""}
        </h2>

        {eligibility.canReview && <ReviewForm productId={product.id} />}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun avis pour l&apos;instant. Soyez le premier a noter ce produit apres l&apos;avoir recu.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                      {initials(r.author)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium">
                        {r.author}
                        {r.verified && (
                          <span className="flex items-center gap-0.5 text-xs font-normal text-primary">
                            <BadgeCheck className="size-3.5" /> Achat verifie
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.stars ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-muted-foreground/40"
                        }
                      />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, MapPin } from "lucide-react";
import { listProducts } from "@/lib/queries/products";
import { CATEGORIES } from "@/lib/constants";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listProducts({ inStock: true, limit: 12 });

  return (
    <div className="container space-y-10 py-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-brand-dark px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Tout Daloa, livre chez vous.
          </h1>
          <p className="mt-3 text-white/80">
            Achetez aupres des commercants de Daloa et faites livrer rapidement
            par nos livreurs partenaires.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/produits">
                Explorer les produits <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/devenir-vendeur">Vendre sur DALOA HUB</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Livraison rapide", desc: "Le livreur disponible le plus proche est affecte automatiquement." },
          { icon: ShieldCheck, title: "Achat securise", desc: "Vendeurs verifies et commandes suivies de bout en bout." },
          { icon: MapPin, title: "100% Daloa", desc: "Une plateforme pensee pour la ville de Daloa." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-lg border bg-card p-4">
            <Icon className="size-6 shrink-0 text-brand-green" />
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Categories</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/produits?categorie=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition-colors hover:border-brand-green"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
                {c.label.slice(0, 2)}
              </span>
              <span className="text-xs font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produits */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Produits populaires</h2>
          <Link href="/produits" className="text-sm font-medium text-brand-green">
            Voir tout
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Aucun produit disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

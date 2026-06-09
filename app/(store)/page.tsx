import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, MapPin } from "lucide-react";
import { listProducts } from "@/lib/queries/products";
import { CATEGORIES } from "@/lib/constants";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products } = await listProducts({ inStock: true, pageSize: 12 });

  return (
    <div className="container space-y-10 py-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-12 text-white shadow-card sm:px-10 sm:py-16">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur animate-in">
            <span className="size-1.5 rounded-full bg-brand-emerald" /> 100% Daloa
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight animate-in delay-75 sm:text-5xl">
            Tout Daloa,
            <br />
            <span className="text-brand-emerald">livre chez vous.</span>
          </h1>
          <p className="mt-4 max-w-md text-white/80 animate-in delay-150">
            Achetez aupres des commercants de Daloa et faites livrer rapidement,
            ou retirez gratuitement en boutique.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 animate-in delay-300">
            <Button asChild size="lg">
              <Link href="/produits">
                Explorer les produits <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:border-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/devenir-vendeur">Vendre sur DALOA HUB</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-green/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-brand-royal/30 blur-3xl" />
      </section>

      {/* Avantages */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Livraison rapide", desc: "Le livreur disponible le plus proche est affecte automatiquement.", tone: "green" },
          { icon: ShieldCheck, title: "Achat securise", desc: "Vendeurs verifies et commandes suivies de bout en bout.", tone: "blue" },
          { icon: MapPin, title: "100% Daloa", desc: "Une plateforme pensee pour la ville de Daloa.", tone: "green" },
        ].map(({ icon: Icon, title, desc, tone }, i) => (
          <div
            key={title}
            className="flex gap-3 rounded-xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card animate-in"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className={
                tone === "blue"
                  ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
                  : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              }
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
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
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-transform duration-300 group-hover:scale-110">
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

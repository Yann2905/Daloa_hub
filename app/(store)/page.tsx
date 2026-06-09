import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, MapPin, Search, Sparkles } from "lucide-react";
import { listProducts } from "@/lib/queries/products";
import { CATEGORIES } from "@/lib/constants";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Couleurs par categorie (du peps !)
const CAT_STYLE: Record<string, string> = {
  mode: "from-pink-500 to-rose-500",
  chaussures: "from-amber-500 to-orange-500",
  telephones: "from-sky-500 to-blue-600",
  informatique: "from-cyan-500 to-teal-600",
  electronique: "from-violet-500 to-purple-600",
  maison: "from-emerald-500 to-green-600",
};

export default async function HomePage() {
  const { products } = await listProducts({ inStock: true, pageSize: 12 });

  return (
    <div className="container space-y-12 py-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-hero-animated px-6 py-14 text-white shadow-card sm:px-12 sm:py-20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur animate-in">
            <Sparkles className="size-3.5 text-brand-emerald" /> La marketplace de Daloa
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight animate-in delay-75 sm:text-6xl">
            Tout Daloa,
            <br />
            <span className="bg-gradient-to-r from-brand-emerald to-sky-300 bg-clip-text text-transparent">
              livre chez vous.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/80 animate-in delay-150">
            Achetez aupres des commercants de Daloa, faites livrer rapidement ou
            retirez gratuitement en boutique.
          </p>

          {/* Recherche dans le hero */}
          <Link
            href="/produits"
            className="mt-7 flex max-w-md items-center gap-3 rounded-2xl bg-white/95 p-1.5 pl-4 text-sm text-muted-foreground shadow-glow animate-in delay-150"
          >
            <Search className="size-4 text-primary" />
            <span className="flex-1">Rechercher un produit, une boutique...</span>
            <span className="flex h-9 items-center rounded-xl bg-primary px-4 font-semibold text-white">
              Go
            </span>
          </Link>

          <div className="mt-6 flex flex-wrap gap-3 animate-in delay-300">
            <Button asChild size="lg" variant="accent">
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
              <Link href="/devenir-vendeur">Devenir vendeur</Link>
            </Button>
          </div>
        </div>

        {/* Halos flottants */}
        <div className="pointer-events-none absolute -right-16 -top-20 size-80 animate-float rounded-full bg-brand-green/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 size-80 rounded-full bg-brand-royal/40 blur-3xl" />
      </section>

      {/* Avantages */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Livraison rapide", desc: "Le livreur disponible le plus proche est affecte automatiquement.", tone: "green" },
          { icon: ShieldCheck, title: "Achat securise", desc: "Vendeurs verifies, commandes suivies de bout en bout.", tone: "blue" },
          { icon: MapPin, title: "100% Daloa", desc: "Une plateforme pensee pour la ville de Daloa.", tone: "green" },
        ].map(({ icon: Icon, title, desc, tone }, i) => (
          <div
            key={title}
            className="group flex gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card animate-in"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft transition-transform duration-300 group-hover:scale-110 ${
                tone === "blue" ? "bg-gradient-to-br from-sky-500 to-blue-600" : "bg-gradient-to-br from-brand-green to-emerald-600"
              }`}
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
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Parcourir par categorie</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/produits?categorie=${c.slug}`}
              className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border bg-card p-5 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card animate-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${CAT_STYLE[c.slug] ?? "from-brand-green to-emerald-600"} text-sm font-bold text-white shadow-soft transition-transform duration-300 group-hover:scale-110`}
              >
                {c.label.slice(0, 2)}
              </span>
              <span className="text-sm font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produits */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Produits populaires</h2>
          <Link
            href="/produits"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 hover:underline"
          >
            Voir tout <ArrowRight className="size-4" />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
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

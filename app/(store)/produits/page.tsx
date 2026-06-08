import { listProducts, type ProductFilters as PF } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: PF = {
    search: sp.q,
    category: sp.categorie,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStock: sp.dispo === "1",
    sort: (sp.tri as PF["sort"]) ?? "recent",
  };
  const products = await listProducts(filters);

  return (
    <div className="container space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-bold">Produits</h1>
        <p className="text-sm text-muted-foreground">
          {products.length} produit{products.length > 1 ? "s" : ""} disponible
          {products.length > 1 ? "s" : ""}
        </p>
      </div>

      <ProductFilters />

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Aucun produit ne correspond a votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

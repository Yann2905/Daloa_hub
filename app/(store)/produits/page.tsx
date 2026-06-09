import { listProducts, type ProductFilters as PF } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

const PAGE_SIZE = 24;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const filters: PF = {
    search: sp.q,
    category: sp.categorie,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStock: sp.dispo === "1",
    sort: (sp.tri as PF["sort"]) ?? "recent",
    page,
    pageSize: PAGE_SIZE,
  };
  const { products, total } = await listProducts(filters);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container space-y-5 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
        <p className="text-sm text-muted-foreground">
          {total} produit{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
        </p>
      </div>

      <ProductFilters />

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-16 text-center text-muted-foreground">
          Aucun produit ne correspond a votre recherche.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

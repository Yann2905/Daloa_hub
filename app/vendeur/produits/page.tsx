import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { getMyVendor, listVendorProductsWithImages } from "@/lib/queries/vendor";
import { ProductRow } from "@/components/vendor/product-row";
import { Button } from "@/components/ui/button";

export default async function VendorProductsPage() {
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const products = await listVendorProductsWithImages(vendor.id);
  const activeCount = products.filter((p) => p.is_active).length;
  const limit = vendor.product_limit ?? 15;
  const atLimit = activeCount >= limit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground">
            <span className={atLimit ? "font-semibold text-amber-600" : "font-semibold text-primary"}>
              {activeCount}/{limit}
            </span>{" "}
            actifs{vendor.verified ? " (boutique certifiee)" : ""}
          </p>
        </div>
        <Button asChild disabled={atLimit}>
          <Link href={atLimit ? "#" : "/vendeur/produits/nouveau"}>
            <Plus className="size-4" /> Ajouter
          </Link>
        </Button>
      </div>

      {atLimit && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Limite de {limit} produits actifs atteinte. Desactivez ou supprimez un produit pour en ajouter
          {!vendor.verified && ", ou faites certifier votre boutique"}.
        </p>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun produit pour le moment.</p>
          <Button asChild>
            <Link href="/vendeur/produits/nouveau">Ajouter mon premier produit</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              imageUrl={p.product_images?.sort((a, b) => a.position - b.position)[0]?.url ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

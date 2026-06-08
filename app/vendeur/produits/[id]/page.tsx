import { notFound } from "next/navigation";
import { getProduct, listCategories } from "@/lib/queries/products";
import { getMyVendor } from "@/lib/queries/vendor";
import { ProductForm } from "@/components/vendor/product-form";

export const metadata = { title: "Modifier le produit" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vendor, product, categories] = await Promise.all([
    getMyVendor(),
    getProduct(id),
    listCategories(),
  ]);

  if (!product || !vendor || product.vendor_id !== vendor.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Modifier le produit</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}

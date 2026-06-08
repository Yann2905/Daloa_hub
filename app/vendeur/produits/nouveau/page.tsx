import { listCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/vendor/product-form";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nouveau produit</h1>
      <ProductForm categories={categories} />
    </div>
  );
}

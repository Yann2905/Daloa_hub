"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/actions/vendor";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/upload/image-uploader";
import type { Category, ProductWithImages } from "@/lib/database.types";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithImages;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isBulky, setIsBulky] = useState(product?.is_bulky ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(
    product?.product_images?.map((i) => i.url) ?? [],
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name,
      description,
      price,
      stock,
      category_id: categoryId,
      is_bulky: isBulky,
      is_active: isActive,
      images,
    };
    const res = isEdit
      ? await updateProduct(product!.id, payload)
      : await createProduct(payload);
    setBusy(false);

    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: isEdit ? "Produit mis a jour" : "Produit ajoute", variant: "success" });
    router.push("/vendeur/produits");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Images du produit</Label>
        <ImageUploader bucket="products" value={images} onChange={setImages} max={6} />
        <p className="text-xs text-muted-foreground">
          Jusqu&apos;a 6 photos. La 1re est l&apos;image principale ; le client pourra faire defiler les autres.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categorie</Label>
        <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Selectionner...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isBulky} onChange={(e) => setIsBulky(e.target.checked)} />
        Article volumineux (tarif de livraison majore)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Produit visible en boutique
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Enregistrer" : "Ajouter le produit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

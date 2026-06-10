"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
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
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price != null ? String(product.compare_at_price) : "",
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isBulky, setIsBulky] = useState(product?.is_bulky ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [options, setOptions] = useState<{ name: string; valuesText: string }[]>(
    product?.options?.map((o) => ({ name: o.name, valuesText: o.values.join(", ") })) ?? [],
  );
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
      compare_at_price: compareAt ? Number(compareAt) : undefined,
      stock,
      category_id: categoryId,
      is_bulky: isBulky,
      is_active: isActive,
      images,
      options: options
        .map((o) => ({
          name: o.name.trim(),
          values: o.valuesText.split(",").map((v) => v.trim()).filter(Boolean),
        }))
        .filter((o) => o.name && o.values.length > 0),
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
        <ImageUploader bucket="products" value={images} onChange={setImages} max={5} />
        <p className="text-xs text-muted-foreground">
          Jusqu&apos;a 5 photos. La 1re est l&apos;image principale ; le client pourra faire defiler les autres.
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
          <Label htmlFor="price">Prix de vente (FCFA)</Label>
          <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="compare">Prix avant promo (FCFA, optionnel)</Label>
        <Input
          id="compare"
          type="number"
          min={0}
          placeholder="Ex : 10000"
          value={compareAt}
          onChange={(e) => setCompareAt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          S&apos;il est superieur au prix de vente, un badge promo et le prix barre s&apos;affichent.
        </p>
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

      {/* Variantes (taille, couleur...) */}
      <div className="space-y-2 rounded-xl border bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <Label>Variantes (optionnel)</Label>
          <button
            type="button"
            onClick={() => setOptions((o) => [...o, { name: "", valuesText: "" }])}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Plus className="size-4" /> Ajouter
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ex : « Taille » avec « 38, 39, 40 » ou « Couleur » avec « Rouge, Noir ». Le client choisira avant d&apos;acheter.
        </p>
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Nom (ex: Taille)"
              value={o.name}
              onChange={(e) =>
                setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
              className="w-1/3"
            />
            <Input
              placeholder="Valeurs separees par des virgules"
              value={o.valuesText}
              onChange={(e) =>
                setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, valuesText: e.target.value } : x)))
              }
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label="Supprimer"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
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

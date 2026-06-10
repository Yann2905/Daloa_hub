"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Pencil, Trash2, ImageOff, Eye, EyeOff } from "lucide-react";
import { deleteProduct, toggleProductActive } from "@/lib/actions/vendor";
import { formatFcfa } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/database.types";

export function ProductRow({
  product,
  imageUrl,
}: {
  product: Product;
  imageUrl: string | null;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function onToggle() {
    startTransition(async () => {
      const res = await toggleProductActive(product.id, !product.is_active);
      if (res.error) toast({ title: res.error, variant: "error" });
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.error) toast({ title: res.error, variant: "error" });
      else toast({ title: "Produit supprime", variant: "success" });
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatFcfa(product.price)} - Stock : {product.stock}
        </p>
        <div className="mt-1 flex gap-1">
          {product.is_active ? (
            <Badge variant="success">Visible</Badge>
          ) : (
            <Badge variant="secondary">Masque</Badge>
          )}
          {product.stock <= 0 ? (
            <Badge variant="destructive">Rupture</Badge>
          ) : (
            product.stock <= 3 && <Badge variant="warning">Stock bas ({product.stock})</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onToggle} disabled={pending} className="rounded-md p-2 hover:bg-secondary" aria-label="Basculer visibilite">
          {product.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <Link href={`/vendeur/produits/${product.id}`} className="rounded-md p-2 hover:bg-secondary" aria-label="Modifier">
          <Pencil className="size-4" />
        </Link>
        {confirming ? (
          <button onClick={onDelete} disabled={pending} className="rounded-md bg-destructive px-2 py-1 text-xs text-white">
            Confirmer
          </button>
        ) : (
          <button onClick={() => setConfirming(true)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" aria-label="Supprimer">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

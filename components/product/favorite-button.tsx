"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "./favorites-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  className,
  iconClassName = "size-5",
}: {
  productId: string;
  className?: string;
  iconClassName?: string;
}) {
  const { has, toggle } = useFavorites();
  const { toast } = useToast();
  const fav = has(productId);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggle(productId);
    if (res.error) toast({ title: res.error, variant: "error" });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "flex items-center justify-center rounded-full bg-black/40 text-white shadow-soft backdrop-blur transition active:scale-90",
        className,
      )}
    >
      <Heart className={cn(iconClassName, fav ? "fill-red-500 text-red-500" : "")} />
    </button>
  );
}

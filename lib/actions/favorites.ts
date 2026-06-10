"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

/** Ajoute / retire un produit des favoris de l'utilisateur courant. */
export async function toggleFavorite(
  productId: string,
): Promise<{ favorited?: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Connectez-vous pour enregistrer vos favoris." };
  if (!z.string().uuid().safeParse(productId).success) return { error: "Produit invalide." };

  const existing = await sql`
    select 1 from favorites where user_id = ${user.id} and product_id = ${productId}
  `;
  if (existing.length > 0) {
    await sql`delete from favorites where user_id = ${user.id} and product_id = ${productId}`;
    return { favorited: false };
  }
  await sql`
    insert into favorites (user_id, product_id) values (${user.id}, ${productId})
    on conflict do nothing
  `;
  return { favorited: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

const schema = z.object({
  productId: z.string().uuid(),
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/** Laisse un avis (uniquement si le client a recu le produit et n'a pas deja note). */
export async function addReview(input: {
  productId: string;
  stars: number;
  comment?: string;
}): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Avis invalide." };
  const user = await getUser();
  if (!user) return { error: "Connectez-vous pour laisser un avis." };

  const { productId, stars, comment } = parsed.data;

  const [already] = await sql`
    select 1 from reviews where product_id = ${productId} and client_id = ${user.id} limit 1
  `;
  if (already) return { error: "Vous avez deja laisse un avis pour ce produit." };

  // Achat verifie : une commande livree contenant ce produit.
  const [delivered] = await sql<{ id: string }[]>`
    select o.id from orders o
    join order_items oi on oi.order_id = o.id
    where o.client_id = ${user.id} and oi.product_id = ${productId}
      and o.status = 'delivered'
    limit 1
  `;
  if (!delivered) return { error: "Vous pourrez noter ce produit apres l'avoir recu." };

  await sql`
    insert into reviews (product_id, order_id, client_id, stars, comment)
    values (${productId}, ${delivered.id}, ${user.id}, ${stars}, ${comment?.trim() || null})
  `;
  revalidatePath(`/produits/${productId}`);
  return {};
}

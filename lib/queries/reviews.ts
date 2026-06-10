import "server-only";
import { sql } from "@/lib/db";

export interface ProductReview {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  author: string;
  verified: boolean;
}

export async function listProductReviews(productId: string): Promise<ProductReview[]> {
  return await sql<ProductReview[]>`
    select r.id, r.stars, r.comment, r.created_at,
           u.full_name as author,
           (r.order_id is not null) as verified
    from reviews r
    join users u on u.id = r.client_id
    where r.product_id = ${productId}
    order by r.created_at desc
    limit 50
  `;
}

/**
 * Le client peut-il laisser un avis ? (a recu le produit ET pas encore note).
 * Retourne aussi l'id d'une commande livree contenant ce produit.
 */
export async function getReviewEligibility(
  productId: string,
  userId: string,
): Promise<{ canReview: boolean; orderId: string | null }> {
  const [already] = await sql`
    select 1 from reviews where product_id = ${productId} and client_id = ${userId} limit 1
  `;
  if (already) return { canReview: false, orderId: null };

  const [delivered] = await sql<{ id: string }[]>`
    select o.id from orders o
    join order_items oi on oi.order_id = o.id
    where o.client_id = ${userId} and oi.product_id = ${productId}
      and o.status = 'delivered'
    limit 1
  `;
  return { canReview: !!delivered, orderId: delivered?.id ?? null };
}

import "server-only";
import { sql } from "@/lib/db";

/**
 * Aligne le nombre de produits ACTIFS d'une boutique sur sa limite.
 * - trop d'actifs -> desactive les PLUS RECENTS en trop (marques par le systeme)
 * - moins que la limite -> reactive les produits desactives par le systeme
 *   (les plus recents d'abord), jusqu'a atteindre la limite.
 * A appeler dans une transaction si possible (sql ou tx).
 */
export async function reconcileVendorProducts(
  vendorId: string,
  limit: number,
): Promise<void> {
  const [{ active }] = await sql<{ active: number }[]>`
    select count(*)::int as active from products
    where vendor_id = ${vendorId} and is_active = true
  `;
  if (active > limit) {
    const excess = active - limit;
    await sql`
      update products set is_active = false, deactivated_by_limit = true
      where id in (
        select id from products where vendor_id = ${vendorId} and is_active = true
        order by created_at desc limit ${excess}
      )
    `;
  } else if (active < limit) {
    const room = limit - active;
    await sql`
      update products set is_active = true, deactivated_by_limit = false
      where id in (
        select id from products where vendor_id = ${vendorId}
          and is_active = false and deactivated_by_limit = true
        order by created_at desc limit ${room}
      )
    `;
  }
}

/** Nombre de produits actifs d'une boutique. */
export async function countActiveProducts(vendorId: string): Promise<number> {
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from products where vendor_id = ${vendorId} and is_active = true
  `;
  return n ?? 0;
}

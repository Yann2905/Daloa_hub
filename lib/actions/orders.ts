"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { computeDeliveryFee, resolveDeliveryType } from "@/lib/delivery";
import { haversineKm } from "@/lib/geo";
import { emailUser, orderEmailButton } from "@/lib/email";
import type { CategorySlug } from "@/lib/constants";
import type { OrderStatus } from "@/lib/database.types";

export interface ActionState {
  error?: string;
  orderId?: string;
}

const checkoutSchema = z.object({
  vendorId: z.string().uuid(),
  fulfillment: z.enum(["delivery", "pickup"]),
  destLat: z.number().nullable().optional(),
  destLng: z.number().nullable().optional(),
  destAddress: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        categorySlug: z.string(),
        isBulky: z.boolean(),
      }),
    )
    .min(1, "Panier vide"),
});

/**
 * Passe une commande : totaux calcules cote serveur, tarif de livraison
 * automatique, puis RPC place_order (transactionnel). Tente une affectation
 * du livreur le plus proche.
 */
export async function checkout(payload: unknown): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { vendorId, fulfillment, destLat, destLng, destAddress, items } = parsed.data;
  const isPickup = fulfillment === "pickup";

  const user = await getUser();
  if (!user) return { error: "Vous devez etre connecte pour commander." };

  if (!isPickup && (!destAddress || destAddress.trim().length < 3)) {
    return { error: "Indiquez votre quartier pour la livraison." };
  }

  const [vendor] = await sql<{ lat: number | null; lng: number | null; status: string }[]>`
    select lat, lng, status from vendors where id = ${vendorId} limit 1
  `;
  if (!vendor || vendor.status !== "approved") {
    return { error: "Boutique indisponible." };
  }

  const deliveryType = resolveDeliveryType(
    items.map((i) => ({ categorySlug: i.categorySlug as CategorySlug, isBulky: i.isBulky })),
  );

  // En retrait : aucun frais, aucune position, aucun livreur.
  let deliveryFee = 0;
  let distanceKm = 0;
  let dLat: number | null = null;
  let dLng: number | null = null;
  if (!isPickup) {
    dLat = destLat ?? null;
    dLng = destLng ?? null;
    const origin = { lat: vendor.lat ?? dLat ?? 0, lng: vendor.lng ?? dLng ?? 0 };
    if (dLat != null && dLng != null) {
      distanceKm = haversineKm(origin, { lat: dLat, lng: dLng });
    }
    deliveryFee = computeDeliveryFee(deliveryType, distanceKm);
  }

  const itemsArr = items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
  }));

  try {
    const [row] = await sql<{ id: string }[]>`
      select place_order(
        ${user.id}, ${vendorId}, ${sql.json(itemsArr)},
        ${dLat}, ${dLng}, ${destAddress},
        ${deliveryType}::delivery_type, ${deliveryFee}, ${Math.round(distanceKm * 100) / 100}
      ) as id
    `;
    await sql`update orders set fulfillment_type = ${fulfillment}::fulfillment_type where id = ${row.id}`;

    // Recapitulatif pour les emails
    const [ord] = await sql<{ code: string; total: number }[]>`
      select code, total::float8 as total from orders where id = ${row.id}
    `;
    const modeLabel = isPickup ? "Retrait en boutique" : "Livraison a domicile (paiement a la livraison)";

    // Email au vendeur (recu meme s'il n'est pas connecte)
    const [vu] = await sql<{ user_id: string; full_name: string }[]>`
      select u.id as user_id, u.full_name from vendors v
      join users u on u.id = v.user_id where v.id = ${vendorId}
    `;
    if (vu) {
      await emailUser(
        vu.user_id,
        "Nouvelle commande recue",
        `<p>Bonjour ${vu.full_name},</p><p>Nouvelle commande <strong>${ord.code}</strong> sur DALOA HUB.</p><p>Mode : <strong>${modeLabel}</strong></p>${orderEmailButton(row.id, "Voir la commande")}`,
      );
    }

    // Confirmation au client
    await emailUser(
      user.id,
      "Votre commande est confirmee",
      `<p>Merci ! Votre commande <strong>${ord.code}</strong> a bien ete enregistree.</p>
       <p>Mode de reception : <strong>${modeLabel}</strong></p>
       <p>Montant a payer : <strong>${ord.total.toLocaleString("fr-FR")} FCFA</strong>${isPickup ? " (a regler en boutique au retrait)" : " (a regler a la livraison)"}.</p>
       ${orderEmailButton(row.id, "Suivre ma commande")}`,
    );

    // Livraison uniquement : affectation du livreur le plus proche + email
    if (!isPickup) {
      const [{ assign_nearest_driver: driverId }] = await sql<
        { assign_nearest_driver: string | null }[]
      >`select assign_nearest_driver(${row.id})`;
      if (driverId) {
        const [du] = await sql<{ user_id: string; full_name: string }[]>`
          select u.id as user_id, u.full_name from drivers d
          join users u on u.id = d.user_id where d.id = ${driverId}
        `;
        if (du) {
          await emailUser(
            du.user_id,
            "Nouvelle livraison a effectuer",
            `<p>Bonjour ${du.full_name},</p><p>Une commande vous a ete <strong>affectee</strong>.</p>${orderEmailButton(row.id, "Voir la livraison")}`,
          );
        }
      }
    }

    revalidatePath("/commandes");
    return { orderId: row.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Echec de la commande." };
  }
}

/** Verifie que l'utilisateur est partie prenante de la commande. */
async function authorizeOrder(orderId: string) {
  const user = await getUser();
  if (!user) return { error: "Non autorise." as const };
  const [o] = await sql<
    { client_id: string; vendor_user: string | null; driver_user: string | null }[]
  >`
    select o.client_id, v.user_id as vendor_user, d.user_id as driver_user
    from orders o
    join vendors v on v.id = o.vendor_id
    left join drivers d on d.id = o.driver_id
    where o.id = ${orderId} limit 1
  `;
  if (!o) return { error: "Commande introuvable." as const };
  const allowed =
    user.role === "admin" ||
    user.id === o.client_id ||
    user.id === o.vendor_user ||
    user.id === o.driver_user;
  if (!allowed) return { error: "Action non autorisee." as const };
  return { user, order: o };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const auth = await authorizeOrder(orderId);
  if ("error" in auth) return { error: auth.error };

  try {
    await sql`
      update orders set status = ${status}::order_status,
        confirmed_at = case when ${status} = 'confirmed' then now() else confirmed_at end,
        delivered_at = case when ${status} = 'delivered' then now() else delivered_at end
      where id = ${orderId}
    `;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }

  // Email d'avancement au client
  const LABELS: Partial<Record<OrderStatus, string>> = {
    confirmed: "Commande confirmee",
    preparing: "Commande en preparation",
    delivering: "Commande en cours de livraison",
    delivered: "Commande livree",
  };
  if (LABELS[status]) {
    const [o] = await sql<{ client_id: string; code: string }[]>`
      select client_id, code from orders where id = ${orderId}
    `;
    if (o) {
      await emailUser(
        o.client_id,
        LABELS[status]!,
        `<p>Votre commande <strong>${o.code}</strong> : ${LABELS[status]!.toLowerCase()}.</p>${orderEmailButton(orderId, "Suivre ma commande")}`,
      );
    }
  }

  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/vendeur/commandes");
  revalidatePath("/livreur");
  return {};
}

/** Le client refuse : seuls les frais de deplacement sont dus (stock reintegre). */
export async function refuseOrder(
  orderId: string,
  reason: string,
): Promise<{ error?: string }> {
  const auth = await authorizeOrder(orderId);
  if ("error" in auth) return { error: auth.error };
  if (auth.user.id !== auth.order.client_id && auth.user.role !== "admin") {
    return { error: "Seul le client peut refuser." };
  }
  try {
    await sql`select refuse_order(${orderId}, ${reason})`;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
  revalidatePath(`/commandes/${orderId}`);
  return {};
}

export async function reportOrder(input: {
  orderId: string;
  type: "scam" | "non_conform" | "bad_behavior" | "other";
  message: string;
}): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorise." };
  try {
    await sql`
      insert into reports (order_id, reporter_id, type, message)
      values (${input.orderId}, ${user.id}, ${input.type}::report_type, ${input.message})
    `;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
  return {};
}

export async function rateOrder(input: {
  orderId: string;
  vendorId: string;
  driverId?: string | null;
  vendorStars: number;
  driverStars?: number;
  comment?: string;
}): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorise." };
  try {
    await sql`
      insert into ratings (order_id, rater_id, target_type, target_id, stars, comment)
      values (${input.orderId}, ${user.id}, 'vendor', ${input.vendorId},
              ${input.vendorStars}, ${input.comment ?? null})
      on conflict (order_id, target_type)
      do update set stars = excluded.stars, comment = excluded.comment
    `;
    if (input.driverId && input.driverStars) {
      await sql`
        insert into ratings (order_id, rater_id, target_type, target_id, stars)
        values (${input.orderId}, ${user.id}, 'driver', ${input.driverId}, ${input.driverStars})
        on conflict (order_id, target_type)
        do update set stars = excluded.stars
      `;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
  revalidatePath(`/commandes/${input.orderId}`);
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emailUser, orderEmailButton } from "@/lib/email";
import type { DriverStatus } from "@/lib/database.types";

async function requireDriver() {
  const user = await getUser();
  if (!user) throw new Error("Non autorise");
  const [driver] = await sql<{ id: string; status: DriverStatus }[]>`
    select id, status from drivers where user_id = ${user.id} limit 1
  `;
  if (!driver) throw new Error("Profil livreur introuvable");
  return { driver, userId: user.id };
}

const docsSchema = z.object({
  cni_url: z.string().min(3, "CNI requise"),
  vehicle_doc_url: z.string().min(3, "Document du vehicule requis"),
  vehicle_type: z.string().min(2, "Type de vehicule requis"),
});

export async function submitDocuments(input: unknown): Promise<{ error?: string }> {
  const { driver } = await requireDriver();
  const parsed = docsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { cni_url, vehicle_doc_url, vehicle_type } = parsed.data;

  await sql`
    update drivers set cni_url = ${cni_url}, vehicle_doc_url = ${vehicle_doc_url},
      vehicle_type = ${vehicle_type}, status = 'pending'
    where id = ${driver.id}
  `;
  revalidatePath("/livreur");
  return {};
}

export async function setAvailability(available: boolean): Promise<{ error?: string }> {
  const { driver } = await requireDriver();
  if (driver.status !== "approved") {
    return { error: "Votre compte livreur n'est pas encore valide." };
  }
  await sql`update drivers set is_available = ${available}, last_seen_at = now()
            where id = ${driver.id}`;
  revalidatePath("/livreur");
  return {};
}

export async function updatePosition(lat: number, lng: number) {
  const { driver } = await requireDriver();
  await sql`update drivers set lat = ${lat}, lng = ${lng}, last_seen_at = now()
            where id = ${driver.id}`;
  return {};
}

export async function completeDelivery(orderId: string): Promise<{ error?: string }> {
  const { driver } = await requireDriver();
  const updated = await sql<{ client_id: string }[]>`
    update orders set status = 'delivered', delivered_at = now()
    where id = ${orderId} and driver_id = ${driver.id}
    returning client_id
  `;
  if (updated.length === 0) return { error: "Livraison introuvable." };

  await sql`
    insert into notifications (user_id, type, title, body, data)
    values (${updated[0].client_id}, 'delivery_completed', 'Livraison terminee',
      'Votre commande a ete livree. Pensez a evaluer le vendeur et le livreur.',
      ${sql.json({ order_id: orderId })})
  `;
  await emailUser(
    updated[0].client_id,
    "Commande livree",
    `<p>Votre commande a ete <strong>livree</strong>. Pensez a evaluer le vendeur et le livreur.</p>${orderEmailButton(orderId, "Evaluer ma commande")}`,
  );
  revalidatePath("/livreur");
  return {};
}

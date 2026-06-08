"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emailUser } from "@/lib/email";

type Result = { error?: string };

async function ensureAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Acces refuse");
}

// ---------------- Livreurs ----------------
export async function setDriverStatus(
  driverId: string,
  status: "approved" | "rejected" | "pending",
): Promise<Result> {
  await ensureAdmin();
  const updated = await sql<{ user_id: string }[]>`
    update drivers set status = ${status}::driver_status
    where id = ${driverId} returning user_id
  `;
  if (updated[0]) {
    await sql`
      insert into notifications (user_id, type, title, body)
      values (${updated[0].user_id},
        ${status === "approved" ? "driver_approved" : "driver_rejected"}::notification_type,
        ${status === "approved" ? "Compte livreur valide" : "Dossier livreur rejete"},
        ${status === "approved"
          ? "Vous pouvez desormais recevoir des livraisons."
          : "Veuillez verifier et soumettre a nouveau vos documents."})
    `;
    await emailUser(
      updated[0].user_id,
      status === "approved" ? "Compte livreur valide" : "Dossier livreur rejete",
      status === "approved"
        ? "<p>Felicitations, votre compte livreur est <strong>valide</strong>. Vous pouvez desormais recevoir des livraisons.</p>"
        : "<p>Votre dossier livreur a ete rejete. Verifiez et soumettez a nouveau vos documents.</p>",
    );
  }
  revalidatePath("/admin/livreurs");
  return {};
}

// ---------------- Vendeurs ----------------
export async function setVendorStatus(
  vendorId: string,
  status: "approved" | "rejected" | "pending",
): Promise<Result> {
  await ensureAdmin();
  const updated = await sql<{ user_id: string }[]>`
    update vendors set status = ${status}::vendor_status
    where id = ${vendorId} returning user_id
  `;
  if (updated[0] && status === "approved") {
    await sql`
      insert into notifications (user_id, type, title, body)
      values (${updated[0].user_id}, 'vendor_approved', 'Boutique validee',
        'Votre boutique est desormais visible sur DALOA HUB.')
    `;
    await emailUser(
      updated[0].user_id,
      "Boutique validee",
      "<p>Felicitations, votre boutique est <strong>validee</strong> et desormais visible sur DALOA HUB.</p>",
    );
  }
  revalidatePath("/admin/vendeurs");
  return {};
}

// ---------------- Comptes ----------------
export async function setAccountStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<Result> {
  await ensureAdmin();
  await sql`update users set account_status = ${status}::account_status where id = ${userId}`;
  revalidatePath("/admin/utilisateurs");
  return {};
}

// ---------------- Signalements ----------------
export async function resolveReport(
  reportId: string,
  status: "reviewing" | "resolved" | "dismissed",
  adminNote?: string,
): Promise<Result> {
  await ensureAdmin();
  await sql`
    update reports set status = ${status}::report_status, admin_note = ${adminNote ?? null}
    where id = ${reportId}
  `;
  revalidatePath("/admin/signalements");
  return {};
}

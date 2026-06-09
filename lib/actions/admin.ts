"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emailUser } from "@/lib/email";
import { smsUser } from "@/lib/sms";
import { pushUser } from "@/lib/push";
import { signedDocumentUrl } from "@/lib/cloudinary-server";

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
    await smsUser(
      updated[0].user_id,
      status === "approved"
        ? "DALOA HUB: votre compte livreur est valide. Vous pouvez recevoir des livraisons."
        : "DALOA HUB: votre dossier livreur a ete rejete. Verifiez vos documents.",
    );
    await pushUser(updated[0].user_id, {
      title: status === "approved" ? "Compte livreur valide" : "Dossier livreur rejete",
      body: status === "approved" ? "Vous pouvez recevoir des livraisons." : "Verifiez vos documents.",
      url: "/livreur",
    });
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
    await smsUser(
      updated[0].user_id,
      "DALOA HUB: votre boutique est validee et desormais visible.",
    );
    await pushUser(updated[0].user_id, {
      title: "Boutique validee",
      body: "Votre boutique est desormais visible.",
      url: "/vendeur",
    });
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

// ---------------- Consultation document prive (URL signee) ----------------
export async function signDocument(
  ref: string,
): Promise<{ url?: string; error?: string }> {
  await ensureAdmin();
  try {
    return { url: signedDocumentUrl(ref) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

// ---------------- Changement de role ----------------
export async function changeUserRole(
  userId: string,
  role: "client" | "vendor" | "driver" | "admin",
): Promise<Result> {
  await ensureAdmin();
  try {
    await sql.begin(async (tx) => {
      await tx`update users set role = ${role}::user_role where id = ${userId}`;
      if (role === "vendor") {
        await tx`insert into vendors (user_id, shop_name)
                 values (${userId}, 'Ma boutique') on conflict (user_id) do nothing`;
      } else if (role === "driver") {
        await tx`insert into drivers (user_id)
                 values (${userId}) on conflict (user_id) do nothing`;
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
  revalidatePath(`/admin/utilisateurs/${userId}`);
  revalidatePath("/admin/utilisateurs");
  return {};
}

// ---------------- Message admin -> utilisateur (notif + email) ----------------
export async function notifyUser(
  userId: string,
  title: string,
  body: string,
): Promise<Result> {
  await ensureAdmin();
  if (!title.trim() || !body.trim()) return { error: "Titre et message requis." };
  try {
    await sql`
      insert into notifications (user_id, type, title, body)
      values (${userId}, 'report_received', ${title}, ${body})
    `;
    await emailUser(userId, title, `<p>${body.replace(/\n/g, "<br>")}</p>`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
  revalidatePath(`/admin/utilisateurs/${userId}`);
  return {};
}

// ---------------- Moderation produit ----------------
export async function setProductActiveAdmin(
  productId: string,
  isActive: boolean,
): Promise<Result> {
  await ensureAdmin();
  await sql`update products set is_active = ${isActive} where id = ${productId}`;
  revalidatePath("/admin/produits");
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

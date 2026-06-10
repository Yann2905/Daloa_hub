"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emailUser } from "@/lib/email";
import { smsUser } from "@/lib/sms";
import { pushUser } from "@/lib/push";
import { reconcileVendorProducts } from "@/lib/vendor-limits";
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

// ---------------- Suppression d'un utilisateur (definitive, cascade) ----------------
export async function deleteUser(userId: string): Promise<Result> {
  await ensureAdmin();
  const me = await getUser();
  if (me?.id === userId) return { error: "Vous ne pouvez pas supprimer votre propre compte." };

  const [target] = await sql<{ role: string }[]>`select role from users where id = ${userId}`;
  if (!target) return { error: "Utilisateur introuvable." };
  if (target.role === "admin") return { error: "Impossible de supprimer un administrateur." };

  try {
    await sql.begin(async (tx) => {
      // Les FK orders.client_id / orders.vendor_id sont en RESTRICT : on supprime
      // d'abord les commandes liees (leurs lignes/historiques suivent en cascade).
      await tx`delete from orders where client_id = ${userId}`;
      await tx`delete from orders where vendor_id in (select id from vendors where user_id = ${userId})`;
      // Le reste (boutique, livreur, messages, favoris, avis, tokens...) suit en cascade.
      await tx`delete from users where id = ${userId}`;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Suppression impossible." };
  }
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

// ---------------- Certification boutique ----------------
export async function setVendorVerified(
  vendorId: string,
  verified: boolean,
): Promise<Result> {
  await ensureAdmin();
  const [v] = verified
    ? await sql<{ user_id: string; product_limit: number }[]>`
        update vendors set verified = true, product_limit = greatest(product_limit, 30)
        where id = ${vendorId} returning user_id, product_limit`
    : await sql<{ user_id: string; product_limit: number }[]>`
        update vendors set verified = false, product_limit = 15
        where id = ${vendorId} returning user_id, product_limit`;
  const userId = v?.user_id;
  const newLimit = v?.product_limit ?? (verified ? 30 : 15);
  if (userId) await reconcileVendorProducts(vendorId, newLimit);

  if (userId) {
    if (verified) {
      await sql`insert into notifications (user_id, type, title, body)
        values (${userId}, 'vendor_approved', ${"Boutique certifiee"},
        ${`Felicitations ! Votre boutique est certifiee DALOA HUB (badge bleu). Vous pouvez avoir jusqu'a ${newLimit} produits actifs.`})`;
      await pushUser(userId, {
        title: "Boutique certifiee",
        body: `Badge certifie + jusqu'a ${newLimit} produits.`,
        url: "/vendeur",
      });
    } else {
      await sql`insert into notifications (user_id, type, title, body)
        values (${userId}, 'report_received', ${"Certification retiree"},
        ${"Votre boutique n'est plus certifiee. Limite ramenee a 15 produits actifs ; les produits en trop ont ete desactives."})`;
      await pushUser(userId, {
        title: "Certification retiree",
        body: "Limite ramenee a 15 produits actifs.",
        url: "/vendeur/produits",
      });
    }
  }
  revalidatePath("/admin/vendeurs");
  return {};
}

/** Definit une limite de produits personnalisee pour une boutique (controle admin). */
export async function setVendorProductLimit(
  vendorId: string,
  limit: number,
): Promise<Result> {
  await ensureAdmin();
  const n = Math.max(0, Math.min(1000, Math.floor(limit)));
  const [v] = await sql<{ user_id: string }[]>`
    update vendors set product_limit = ${n} where id = ${vendorId} returning user_id`;
  const userId = v?.user_id;
  if (userId) await reconcileVendorProducts(vendorId, n);
  if (userId) {
    await sql`insert into notifications (user_id, type, title, body)
      values (${userId}, 'vendor_approved', ${"Limite de produits mise a jour"},
      ${`Vous pouvez desormais avoir jusqu'a ${n} produits actifs.`})`;
    await pushUser(userId, {
      title: "Limite de produits mise a jour",
      body: `Jusqu'a ${n} produits actifs.`,
      url: "/vendeur/produits",
    });
  }
  revalidatePath("/admin/vendeurs");
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

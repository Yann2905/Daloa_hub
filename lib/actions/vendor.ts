"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import {
  SUBSCRIPTION_AMOUNT_FCFA,
  SUBSCRIPTION_PERIOD_DAYS,
} from "@/lib/constants";

type VResult = { error?: string; id?: string };

async function requireVendor() {
  const user = await getUser();
  if (!user) throw new Error("Non autorise");
  const [vendor] = await sql<{ id: string }[]>`
    select id from vendors where user_id = ${user.id} limit 1
  `;
  if (!vendor) throw new Error("Boutique introuvable");
  return { vendorId: vendor.id, userId: user.id };
}

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Prix invalide"),
  stock: z.coerce.number().int().nonnegative("Stock invalide"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  is_bulky: z.boolean().optional(),
  is_active: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
});

export async function createProduct(input: unknown): Promise<VResult> {
  const { vendorId } = await requireVendor();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { images, category_id, name, description, price, stock, is_bulky, is_active } =
    parsed.data;

  try {
    const productId = await sql.begin(async (tx) => {
      const [p] = await tx<{ id: string }[]>`
        insert into products (vendor_id, category_id, name, description, price,
          stock, is_bulky, is_active)
        values (${vendorId}, ${category_id || null}, ${name}, ${description ?? null},
          ${price}, ${stock}, ${is_bulky ?? false}, ${is_active ?? true})
        returning id
      `;
      if (images?.length) {
        for (let i = 0; i < images.length; i++) {
          await tx`insert into product_images (product_id, url, position)
                   values (${p.id}, ${images[i]}, ${i})`;
        }
      }
      return p.id;
    });
    revalidatePath("/vendeur/produits");
    return { id: productId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

export async function updateProduct(productId: string, input: unknown): Promise<VResult> {
  const { vendorId } = await requireVendor();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { images, category_id, name, description, price, stock, is_bulky, is_active } =
    parsed.data;

  try {
    await sql.begin(async (tx) => {
      const updated = await tx`
        update products set name = ${name}, description = ${description ?? null},
          price = ${price}, stock = ${stock}, category_id = ${category_id || null},
          is_bulky = ${is_bulky ?? false}, is_active = ${is_active ?? true}
        where id = ${productId} and vendor_id = ${vendorId}
        returning id
      `;
      if (updated.length === 0) throw new Error("Produit introuvable");
      if (images) {
        await tx`delete from product_images where product_id = ${productId}`;
        for (let i = 0; i < images.length; i++) {
          await tx`insert into product_images (product_id, url, position)
                   values (${productId}, ${images[i]}, ${i})`;
        }
      }
    });
    revalidatePath("/vendeur/produits");
    revalidatePath(`/produits/${productId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

export async function deleteProduct(productId: string): Promise<VResult> {
  const { vendorId } = await requireVendor();
  await sql`delete from products where id = ${productId} and vendor_id = ${vendorId}`;
  revalidatePath("/vendeur/produits");
  return {};
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean,
): Promise<VResult> {
  const { vendorId } = await requireVendor();
  await sql`update products set is_active = ${isActive}
            where id = ${productId} and vendor_id = ${vendorId}`;
  revalidatePath("/vendeur/produits");
  return {};
}

const shopSchema = z.object({
  shop_name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export async function updateShop(input: unknown): Promise<VResult> {
  const { vendorId } = await requireVendor();
  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { shop_name, description, address, lat, lng, logo_url } = parsed.data;
  await sql`
    update vendors set shop_name = ${shop_name}, description = ${description ?? null},
      address = ${address ?? null}, lat = ${lat ?? null}, lng = ${lng ?? null},
      logo_url = ${logo_url || null}
    where id = ${vendorId}
  `;
  revalidatePath("/vendeur/boutique");
  return {};
}

/** Renouvellement d'abonnement (1000 FCFA / 30 jours). */
export async function renewSubscription(): Promise<VResult> {
  const { vendorId, userId } = await requireVendor();
  const now = new Date();
  const end = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 86400000);

  try {
    await sql.begin(async (tx) => {
      const [sub] = await tx<{ id: string }[]>`
        insert into subscriptions (vendor_id, amount, status, start_date, end_date)
        values (${vendorId}, ${SUBSCRIPTION_AMOUNT_FCFA}, 'active',
                ${now.toISOString()}, ${end.toISOString()})
        returning id
      `;
      await tx`
        insert into payments (purpose, amount, status, user_id, subscription_id, method)
        values ('subscription', ${SUBSCRIPTION_AMOUNT_FCFA}, 'paid', ${userId},
                ${sub.id}, 'mobile_money')
      `;
      await tx`update vendors set status = 'approved' where id = ${vendorId}`;
    });
    revalidatePath("/vendeur");
    revalidatePath("/vendeur/abonnement");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

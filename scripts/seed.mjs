/**
 * DALOA HUB - Jeu de donnees de demonstration (Neon / PostgreSQL).
 *
 * Cree : admin, 2 vendeurs (boutiques approuvees + abonnement), 2 livreurs
 * (valides), 2 clients, et des produits. Mots de passe hashes (bcrypt).
 *
 * Pre-requis : schema applique (database/daloa_hub_postgresql.sql) et
 * DATABASE_URL dans .env.local.
 *
 * Execution : npm run seed
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (voir .env.local).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

const DALOA = { lat: 6.8772, lng: -6.4502 };
const PASSWORD = "Daloa2025!";
const IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

const jitter = (v) => v + (Math.random() - 0.5) * 0.03;

async function upsertUser({ email, role, full_name, phone }) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const [u] = await sql`
    insert into users (email, password_hash, role, full_name, phone)
    values (${email}, ${hash}, ${role}, ${full_name}, ${phone})
    on conflict (email) do update set role = excluded.role, full_name = excluded.full_name
    returning id
  `;
  return u.id;
}

async function main() {
  console.log("Creation des comptes...");
  await upsertUser({ email: "admin@daloahub.ci", role: "admin", full_name: "Administrateur DALOA", phone: "0700000000" });

  const vendors = [
    { email: "boutique.kone@daloahub.ci", full_name: "Awa Kone", phone: "0701010101", shop: "Boutique Kone" },
    { email: "tech.diallo@daloahub.ci", full_name: "Ibrahim Diallo", phone: "0702020202", shop: "Diallo Electronique" },
  ];
  const drivers = [
    { email: "livreur.traore@daloahub.ci", full_name: "Seydou Traore", phone: "0703030303" },
    { email: "livreur.bamba@daloahub.ci", full_name: "Mariam Bamba", phone: "0704040404" },
  ];
  const clients = [
    { email: "client.yao@daloahub.ci", full_name: "Yao Konan", phone: "0705050505" },
    { email: "client.aya@daloahub.ci", full_name: "Aya Toure", phone: "0706060606" },
  ];

  const vendorIds = [];
  for (const v of vendors) {
    const uid = await upsertUser({ email: v.email, role: "vendor", full_name: v.full_name, phone: v.phone });
    const [vendor] = await sql`
      insert into vendors (user_id, shop_name, status, lat, lng, address, description)
      values (${uid}, ${v.shop}, 'approved', ${jitter(DALOA.lat)}, ${jitter(DALOA.lng)},
              'Centre-ville, Daloa', 'Boutique partenaire DALOA HUB.')
      on conflict (user_id) do update set status = 'approved', shop_name = excluded.shop_name
      returning id
    `;
    vendorIds.push(vendor.id);

    const hasSub = await sql`select 1 from subscriptions where vendor_id = ${vendor.id} limit 1`;
    if (hasSub.length === 0) {
      await sql`
        insert into subscriptions (vendor_id, amount, status, start_date, end_date)
        values (${vendor.id}, 1000, 'active', now(), now() + interval '30 days')
      `;
      await sql`
        insert into payments (purpose, amount, status, user_id, method)
        values ('subscription', 1000, 'paid', ${uid}, 'mobile_money')
      `;
    }
  }

  for (const d of drivers) {
    const uid = await upsertUser({ email: d.email, role: "driver", full_name: d.full_name, phone: d.phone });
    await sql`
      insert into drivers (user_id, status, is_available, vehicle_type, cni_url, vehicle_doc_url, lat, lng)
      values (${uid}, 'approved', true, 'Moto', ${IMG}, ${IMG}, ${jitter(DALOA.lat)}, ${jitter(DALOA.lng)})
      on conflict (user_id) do update set status = 'approved', is_available = true
    `;
  }

  for (const c of clients) {
    await upsertUser({ email: c.email, role: "client", full_name: c.full_name, phone: c.phone });
  }

  console.log("Creation des produits...");
  const cats = await sql`select id, slug from categories`;
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const products = [
    { v: 0, name: "Chemise en pagne", price: 8000, stock: 20, cat: "mode" },
    { v: 0, name: "Robe traditionnelle", price: 15000, stock: 12, cat: "mode" },
    { v: 0, name: "Sandales en cuir", price: 6500, stock: 30, cat: "chaussures" },
    { v: 1, name: "Smartphone Android 128 Go", price: 95000, stock: 8, cat: "telephones" },
    { v: 1, name: "Ecouteurs Bluetooth", price: 12000, stock: 25, cat: "electronique" },
    { v: 1, name: "Ordinateur portable 15 pouces", price: 320000, stock: 5, cat: "informatique" },
    { v: 1, name: "Television 43 pouces", price: 180000, stock: 4, cat: "maison", bulky: true },
  ];

  for (const p of products) {
    const existing = await sql`
      select 1 from products where vendor_id = ${vendorIds[p.v]} and name = ${p.name} limit 1
    `;
    if (existing.length > 0) continue;
    const [prod] = await sql`
      insert into products (vendor_id, category_id, name, description, price, stock, is_bulky, is_active)
      values (${vendorIds[p.v]}, ${catBySlug[p.cat] ?? null}, ${p.name},
              ${p.name + " disponible chez nos partenaires de Daloa."},
              ${p.price}, ${p.stock}, ${p.bulky ?? false}, true)
      returning id
    `;
    await sql`insert into product_images (product_id, url, position) values (${prod.id}, ${IMG}, 0)`;
  }

  console.log("\nTermine. Comptes de demonstration (mot de passe commun : " + PASSWORD + ") :");
  console.log("  Admin   : admin@daloahub.ci");
  console.log("  Vendeur : boutique.kone@daloahub.ci");
  console.log("  Livreur : livreur.traore@daloahub.ci");
  console.log("  Client  : client.yao@daloahub.ci");

  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});

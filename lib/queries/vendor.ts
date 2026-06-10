import "server-only";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import type {
  Vendor,
  Subscription,
  Product,
  ProductWithImages,
  Order,
  OrderItem,
  Payment,
} from "@/lib/database.types";

const VENDOR_COLS = sql`
  id, user_id, shop_name, description, logo_url, status, address, lat, lng,
  rating_avg::float8 as rating_avg, rating_count, created_at, updated_at
`;

/** Commandes par jour sur les 14 derniers jours (pour le graphique vendeur). */
export async function getVendorDailyOrders(vendorId: string): Promise<{ label: string; value: number }[]> {
  try {
    return await sql<{ label: string; value: number }[]>`
      select to_char(d.day, 'DD/MM') as label, coalesce(count(o.id), 0)::int as value
      from generate_series(current_date - interval '6 days', current_date, interval '1 day') as d(day)
      left join orders o on o.vendor_id = ${vendorId} and o.created_at::date = d.day::date
      group by d.day order by d.day
    `;
  } catch {
    return [];
  }
}

export async function getMyVendor(): Promise<Vendor | null> {
  const user = await getUser();
  if (!user) return null;
  const rows = await sql<Vendor[]>`
    select ${VENDOR_COLS} from vendors where user_id = ${user.id} limit 1
  `;
  return rows[0] ?? null;
}

export async function getActiveSubscription(
  vendorId: string,
): Promise<Subscription | null> {
  const rows = await sql<Subscription[]>`
    select id, vendor_id, amount::float8 as amount, status,
           start_date, end_date, created_at, updated_at
    from subscriptions where vendor_id = ${vendorId}
    order by end_date desc limit 1
  `;
  return rows[0] ?? null;
}

export interface VendorStats {
  productCount: number;
  activeProducts: number;
  pendingOrders: number;
  totalOrders: number;
  revenue: number;
}

export async function getVendorStats(vendorId: string): Promise<VendorStats> {
  const [p] = await sql<{ total: number; active: number }[]>`
    select count(*)::int as total,
           count(*) filter (where is_active)::int as active
    from products where vendor_id = ${vendorId}
  `;
  const [o] = await sql<{ total: number; pending: number; revenue: number }[]>`
    select count(*)::int as total,
           count(*) filter (where status = 'pending')::int as pending,
           coalesce(sum(total) filter (where status = 'delivered'), 0)::float8 as revenue
    from orders where vendor_id = ${vendorId}
  `;
  return {
    productCount: p.total,
    activeProducts: p.active,
    totalOrders: o.total,
    pendingOrders: o.pending,
    revenue: o.revenue,
  };
}

export async function listVendorProducts(vendorId: string): Promise<Product[]> {
  return await sql<Product[]>`
    select id, vendor_id, category_id, name, description,
           price::float8 as price, stock, is_bulky, is_active,
           rating_avg::float8 as rating_avg, rating_count, created_at, updated_at
    from products where vendor_id = ${vendorId}
    order by created_at desc
  `;
}

/** Produits du vendeur avec leurs images (vue gestion). */
export async function listVendorProductsWithImages(
  vendorId: string,
): Promise<ProductWithImages[]> {
  return await sql<ProductWithImages[]>`
    select p.id, p.vendor_id, p.category_id, p.name, p.description,
           p.price::float8 as price, p.stock, p.is_bulky, p.is_active,
           p.rating_avg::float8 as rating_avg, p.rating_count,
           p.created_at, p.updated_at,
           coalesce(json_agg(json_build_object('id', pi.id, 'product_id', pi.product_id,
             'url', pi.url, 'position', pi.position) order by pi.position)
             filter (where pi.id is not null), '[]') as product_images
    from products p
    left join product_images pi on pi.product_id = p.id
    where p.vendor_id = ${vendorId}
    group by p.id
    order by p.created_at desc
  `;
}

export interface OrderItemBrief {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
  variant: string | null;
}

export interface VendorOrderRow extends Order {
  order_items: OrderItemBrief[];
  client: { full_name: string; phone: string | null } | null;
  driver: {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    vehicle_type: string | null;
    has_cni: boolean;
    verified: boolean;
  } | null;
}

export async function listVendorOrders(
  vendorId: string,
  q?: string,
): Promise<VendorOrderRow[]> {
  return await sql<VendorOrderRow[]>`
    select o.id, o.code, o.client_id, o.vendor_id, o.driver_id, o.status,
           o.delivery_type, o.fulfillment_type, o.subtotal::float8 as subtotal,
           o.delivery_fee::float8 as delivery_fee, o.total::float8 as total,
           o.distance_km::float8 as distance_km, o.dest_lat, o.dest_lng,
           o.dest_address, o.refused, o.refusal_reason, o.delivery_fee_paid,
           o.vendor_settled, o.settled_at,
           o.created_at, o.updated_at, o.confirmed_at, o.delivered_at,
           json_build_object('full_name', cu.full_name, 'phone', cu.phone) as client,
           case when d.id is not null then json_build_object(
             'id', d.id, 'full_name', du.full_name, 'phone', du.phone,
             'avatar_url', du.avatar_url, 'vehicle_type', d.vehicle_type,
             'has_cni', (d.cni_url is not null), 'verified', d.verified
           ) end as driver,
           coalesce(json_agg(json_build_object('id', oi.id, 'name', oi.name,
             'quantity', oi.quantity, 'unit_price', oi.unit_price::float8, 'variant', oi.variant,
             'image_url', (select pi.url from product_images pi
               where pi.product_id = oi.product_id order by pi.position limit 1))
             order by oi.created_at) filter (where oi.id is not null), '[]') as order_items
    from orders o
    join users cu on cu.id = o.client_id
    left join drivers d on d.id = o.driver_id
    left join users du on du.id = d.user_id
    left join order_items oi on oi.order_id = o.id
    where o.vendor_id = ${vendorId}
      ${q ? sql`and (o.code ilike ${"%" + q + "%"} or cu.phone ilike ${"%" + q + "%"} or cu.full_name ilike ${"%" + q + "%"})` : sql``}
    group by o.id, cu.full_name, cu.phone, d.id, du.full_name, du.phone, du.avatar_url, d.vehicle_type, d.cni_url
    order by o.created_at desc
  `;
}

export async function getVendorPayments(userId: string): Promise<Payment[]> {
  return await sql<Payment[]>`
    select id, purpose, amount::float8 as amount, status, user_id, order_id,
           subscription_id, method, reference, created_at, updated_at
    from payments
    where user_id = ${userId} and purpose = 'subscription'
    order by created_at desc limit 12
  `;
}

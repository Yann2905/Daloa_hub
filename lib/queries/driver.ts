import "server-only";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import type { Driver, Order } from "@/lib/database.types";

export async function getMyDriver(): Promise<Driver | null> {
  const user = await getUser();
  if (!user) return null;
  const rows = await sql<Driver[]>`
    select id, user_id, status, cni_url, vehicle_doc_url, vehicle_type,
           is_available, lat, lng, last_seen_at,
           rating_avg::float8 as rating_avg, rating_count, created_at, updated_at
    from drivers where user_id = ${user.id} limit 1
  `;
  return rows[0] ?? null;
}

export interface DeliveryRow extends Order {
  order_items: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    image_url: string | null;
    variant: string | null;
  }[];
  client: { full_name: string; phone: string | null } | null;
  shop: {
    name: string;
    phone: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
}

export async function listDriverDeliveries(
  driverId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<DeliveryRow[]> {
  try {
    const statusFilter = opts.activeOnly
      ? sql`and o.status in ('confirmed','preparing','delivering')`
      : sql``;
    return await sql<DeliveryRow[]>`
      select
        o.id, o.code, o.client_id, o.vendor_id, o.driver_id, o.status,
        o.delivery_type, o.fulfillment_type, o.subtotal::float8 as subtotal,
        o.delivery_fee::float8 as delivery_fee, o.total::float8 as total,
        o.distance_km::float8 as distance_km, o.dest_lat, o.dest_lng,
        o.dest_address, o.refused, o.refusal_reason, o.delivery_fee_paid,
        o.vendor_settled, o.settled_at,
        o.created_at, o.updated_at, o.confirmed_at, o.delivered_at,
        json_build_object('full_name', u.full_name, 'phone', u.phone) as client,
        json_build_object('name', v.shop_name, 'phone', vu.phone, 'address', v.address,
          'lat', v.lat, 'lng', v.lng) as shop,
        coalesce(json_agg(json_build_object('id', oi.id, 'name', oi.name,
          'quantity', oi.quantity, 'unit_price', oi.unit_price::float8, 'variant', oi.variant,
          'image_url', (select pi.url from product_images pi
            where pi.product_id = oi.product_id order by pi.position limit 1))
          order by oi.created_at) filter (where oi.id is not null), '[]') as order_items
      from orders o
      join users u on u.id = o.client_id
      join vendors v on v.id = o.vendor_id
      left join users vu on vu.id = v.user_id
      left join order_items oi on oi.order_id = o.id
      where o.driver_id = ${driverId} ${statusFilter}
      group by o.id, u.full_name, u.phone, v.shop_name, vu.phone, v.address, v.lat, v.lng
      order by o.created_at desc
    `;
  } catch {
    return [];
  }
}

/** Cash que le livreur doit reverser aux vendeurs (livre, non regle). */
export async function getDriverCashDue(driverId: string): Promise<number> {
  try {
    const [r] = await sql<{ due: number }[]>`
      select coalesce(sum(subtotal) filter (
        where status = 'delivered' and not refused and not vendor_settled
          and fulfillment_type = 'delivery'
      ), 0)::float8 as due
      from orders where driver_id = ${driverId}
    `;
    return r?.due ?? 0;
  } catch {
    return 0;
  }
}

import "server-only";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/database.types";

const ORDER_COLS = sql`
  o.id, o.code, o.client_id, o.vendor_id, o.driver_id, o.status, o.delivery_type,
  o.fulfillment_type,
  o.subtotal::float8 as subtotal, o.delivery_fee::float8 as delivery_fee,
  o.total::float8 as total, o.distance_km::float8 as distance_km,
  o.dest_lat, o.dest_lng, o.dest_address, o.refused, o.refusal_reason,
  o.delivery_fee_paid, o.created_at, o.updated_at, o.confirmed_at, o.delivered_at
`;

export interface OrderListRow extends Order {
  vendors: { id: string; shop_name: string } | null;
  order_items: { id: string; name: string; quantity: number }[];
}

export async function listMyOrders(): Promise<OrderListRow[]> {
  try {
    const user = await getUser();
    if (!user) return [];
    return await sql<OrderListRow[]>`
      select ${ORDER_COLS},
        json_build_object('id', v.id, 'shop_name', v.shop_name) as vendors,
        coalesce(json_agg(json_build_object('id', oi.id, 'name', oi.name,
          'quantity', oi.quantity)) filter (where oi.id is not null), '[]') as order_items
      from orders o
      join vendors v on v.id = o.vendor_id
      left join order_items oi on oi.order_id = o.id
      where o.client_id = ${user.id}
      group by o.id, v.id
      order by o.created_at desc
    `;
  } catch {
    return [];
  }
}

export interface OrderDetail extends Order {
  vendors: { id: string; shop_name: string; user_id: string } | null;
  drivers: { id: string; user_id: string } | null;
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  try {
    const rows = await sql<OrderDetail[]>`
      select ${ORDER_COLS},
        json_build_object('id', v.id, 'shop_name', v.shop_name,
          'user_id', v.user_id) as vendors,
        case when d.id is not null
          then json_build_object('id', d.id, 'user_id', d.user_id) end as drivers,
        coalesce((
          select json_agg(json_build_object('id', oi.id, 'order_id', oi.order_id,
            'product_id', oi.product_id, 'name', oi.name,
            'unit_price', oi.unit_price::float8, 'quantity', oi.quantity,
            'line_total', oi.line_total::float8, 'created_at', oi.created_at))
          from order_items oi where oi.order_id = o.id), '[]') as order_items,
        coalesce((
          select json_agg(json_build_object('id', h.id, 'order_id', h.order_id,
            'status', h.status, 'note', h.note, 'created_by', h.created_by,
            'created_at', h.created_at) order by h.created_at)
          from order_status_history h where h.order_id = o.id), '[]') as order_status_history
      from orders o
      join vendors v on v.id = o.vendor_id
      left join drivers d on d.id = o.driver_id
      where o.id = ${id}
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

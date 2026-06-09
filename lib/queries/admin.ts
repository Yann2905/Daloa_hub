import "server-only";
import { sql } from "@/lib/db";
import type {
  Profile,
  Driver,
  Vendor,
  Report,
  Subscription,
} from "@/lib/database.types";

export interface PlatformStats {
  users: number;
  vendorsActive: number;
  driversActive: number;
  orders: number;
  subscriptionRevenue: number;
  openReports: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [row] = await sql<PlatformStats[]>`
    select
      (select count(*)::int from users) as "users",
      (select count(*)::int from vendors where status = 'approved') as "vendorsActive",
      (select count(*)::int from drivers where status = 'approved') as "driversActive",
      (select count(*)::int from orders) as "orders",
      (select coalesce(sum(amount), 0)::float8 from payments
         where purpose = 'subscription' and status = 'paid') as "subscriptionRevenue",
      (select count(*)::int from reports where status = 'open') as "openReports"
  `;
  return row;
}

export interface DailyPoint {
  date: string;
  orders: number;
  users: number;
}

export async function getDailySeries(days = 14): Promise<DailyPoint[]> {
  const rows = await sql<DailyPoint[]>`
    with d as (
      select generate_series(
        (current_date - ${days - 1}::int), current_date, interval '1 day'
      )::date as day
    )
    select to_char(d.day, 'MM-DD') as date,
      (select count(*)::int from orders o where o.created_at::date = d.day) as "orders",
      (select count(*)::int from users u where u.created_at::date = d.day) as "users"
    from d order by d.day
  `;
  return rows;
}

// ---------------- Listes administrateur ----------------

export async function listUsers(
  opts: { role?: string; q?: string; page?: number; pageSize?: number } = {},
): Promise<{ users: Profile[]; total: number }> {
  const pageSize = opts.pageSize ?? 25;
  const offset = (Math.max(1, opts.page ?? 1) - 1) * pageSize;
  const rows = await sql<(Profile & { total: number })[]>`
    select id, role, full_name, email, phone, avatar_url, address,
           lat, lng, account_status, email_verified, created_at, updated_at,
           count(*) over() as total
    from users
    where 1 = 1
      ${opts.role ? sql`and role = ${opts.role}::user_role` : sql``}
      ${opts.q ? sql`and (full_name ilike ${"%" + opts.q + "%"} or email ilike ${"%" + opts.q + "%"} or phone ilike ${"%" + opts.q + "%"})` : sql``}
    order by created_at desc limit ${pageSize} offset ${offset}
  `;
  const total = rows[0] ? Number(rows[0].total) : 0;
  return { users: rows as unknown as Profile[], total };
}

export interface DriverAdminRow extends Driver {
  profiles: { full_name: string; phone: string | null; email: string | null } | null;
}

export async function listDriversForAdmin(): Promise<DriverAdminRow[]> {
  return await sql<DriverAdminRow[]>`
    select d.id, d.user_id, d.status, d.cni_url, d.vehicle_doc_url,
           d.vehicle_type, d.is_available, d.lat, d.lng, d.last_seen_at,
           d.rating_avg::float8 as rating_avg, d.rating_count,
           d.created_at, d.updated_at,
           json_build_object('full_name', u.full_name, 'phone', u.phone,
             'email', u.email) as profiles
    from drivers d join users u on u.id = d.user_id
    order by d.created_at desc
  `;
}

export interface VendorAdminRow extends Vendor {
  profiles: { full_name: string; phone: string | null } | null;
}

export async function listVendorsForAdmin(): Promise<VendorAdminRow[]> {
  return await sql<VendorAdminRow[]>`
    select v.id, v.user_id, v.shop_name, v.description, v.logo_url, v.status,
           v.address, v.lat, v.lng, v.rating_avg::float8 as rating_avg,
           v.rating_count, v.created_at, v.updated_at,
           json_build_object('full_name', u.full_name, 'phone', u.phone) as profiles
    from vendors v join users u on u.id = v.user_id
    order by v.created_at desc
  `;
}

export interface ReportAdminRow extends Report {
  profiles: { full_name: string } | null;
  orders: { code: string } | null;
}

export async function listReportsForAdmin(): Promise<ReportAdminRow[]> {
  return await sql<ReportAdminRow[]>`
    select r.id, r.order_id, r.reporter_id, r.type, r.message, r.status,
           r.admin_note, r.created_at, r.updated_at,
           json_build_object('full_name', u.full_name) as profiles,
           case when o.id is not null
             then json_build_object('code', o.code) end as orders
    from reports r
    join users u on u.id = r.reporter_id
    left join orders o on o.id = r.order_id
    order by r.created_at desc
  `;
}

export interface SubscriptionAdminRow extends Subscription {
  vendors: { shop_name: string } | null;
}

export async function listSubscriptionsForAdmin(): Promise<{
  subs: SubscriptionAdminRow[];
  revenue: number;
}> {
  const subs = await sql<SubscriptionAdminRow[]>`
    select s.id, s.vendor_id, s.amount::float8 as amount, s.status,
           s.start_date, s.end_date, s.created_at, s.updated_at,
           json_build_object('shop_name', v.shop_name) as vendors
    from subscriptions s join vendors v on v.id = s.vendor_id
    order by s.created_at desc limit 200
  `;
  const [r] = await sql<{ revenue: number }[]>`
    select coalesce(sum(amount), 0)::float8 as revenue from payments
    where purpose = 'subscription' and status = 'paid'
  `;
  return { subs, revenue: r.revenue };
}

// ---------------- Dashboard enrichi ----------------

export interface TodayStats {
  ordersToday: number;
  revenueToday: number;
  newUsersToday: number;
  pendingDrivers: number;
}

export async function getTodayStats(): Promise<TodayStats> {
  const [row] = await sql<TodayStats[]>`
    select
      (select count(*)::int from orders where created_at::date = current_date) as "ordersToday",
      (select coalesce(sum(total),0)::float8 from orders
         where status = 'delivered' and delivered_at::date = current_date) as "revenueToday",
      (select count(*)::int from users where created_at::date = current_date) as "newUsersToday",
      (select count(*)::int from drivers where status = 'pending') as "pendingDrivers"
  `;
  return row;
}

export interface RecentOrderRow {
  id: string;
  code: string;
  status: string;
  total: number;
  created_at: string;
  client_name: string;
  shop_name: string;
}

export async function getRecentOrders(limit = 8): Promise<RecentOrderRow[]> {
  return await sql<RecentOrderRow[]>`
    select o.id, o.code, o.status, o.total::float8 as total, o.created_at,
           u.full_name as client_name, v.shop_name
    from orders o
    join users u on u.id = o.client_id
    join vendors v on v.id = o.vendor_id
    order by o.created_at desc limit ${limit}
  `;
}

export interface TopVendorRow {
  id: string;
  shop_name: string;
  orders: number;
  revenue: number;
  rating_avg: number;
}

export async function getTopVendors(limit = 5): Promise<TopVendorRow[]> {
  return await sql<TopVendorRow[]>`
    select v.id, v.shop_name, v.rating_avg::float8 as rating_avg,
           count(o.id)::int as orders,
           coalesce(sum(o.total) filter (where o.status = 'delivered'), 0)::float8 as revenue
    from vendors v
    left join orders o on o.vendor_id = v.id
    where v.status = 'approved'
    group by v.id
    order by revenue desc, orders desc
    limit ${limit}
  `;
}

// ---------------- Toutes les commandes (avec filtres) ----------------

export interface AdminOrderRow {
  id: string;
  code: string;
  status: string;
  fulfillment_type: string;
  total: number;
  created_at: string;
  client_name: string;
  shop_name: string;
}

export async function listAllOrders(opts: {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const pageSize = opts.pageSize ?? 25;
  const offset = (Math.max(1, opts.page ?? 1) - 1) * pageSize;
  const rows = await sql<(AdminOrderRow & { total: number })[]>`
    select o.id, o.code, o.status, o.fulfillment_type, o.total::float8 as total_amount,
           o.created_at, u.full_name as client_name, v.shop_name,
           count(*) over() as total
    from orders o
    join users u on u.id = o.client_id
    join vendors v on v.id = o.vendor_id
    where 1 = 1
      ${opts.status ? sql`and o.status = ${opts.status}::order_status` : sql``}
      ${opts.q ? sql`and (o.code ilike ${"%" + opts.q + "%"} or u.full_name ilike ${"%" + opts.q + "%"})` : sql``}
    order by o.created_at desc
    limit ${pageSize} offset ${offset}
  `;
  const total = rows[0] ? Number(rows[0].total) : 0;
  const orders = rows.map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    fulfillment_type: r.fulfillment_type,
    total: (r as unknown as { total_amount: number }).total_amount,
    created_at: r.created_at,
    client_name: r.client_name,
    shop_name: r.shop_name,
  }));
  return { orders, total };
}

// ---------------- Moderation produits ----------------

export interface AdminProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  shop_name: string;
  vendor_id: string;
  image_url: string | null;
}

export async function listAllProducts(
  opts: { q?: string; page?: number; pageSize?: number } = {},
): Promise<{ products: AdminProductRow[]; total: number }> {
  const pageSize = opts.pageSize ?? 25;
  const offset = (Math.max(1, opts.page ?? 1) - 1) * pageSize;
  const rows = await sql<(AdminProductRow & { total: number })[]>`
    select p.id, p.name, p.price::float8 as price, p.stock, p.is_active,
           v.shop_name, p.vendor_id,
           (select pi.url from product_images pi where pi.product_id = p.id
            order by pi.position limit 1) as image_url,
           count(*) over() as total
    from products p
    join vendors v on v.id = p.vendor_id
    ${opts.q ? sql`where p.name ilike ${"%" + opts.q + "%"}` : sql``}
    order by p.created_at desc
    limit ${pageSize} offset ${offset}
  `;
  const total = rows[0] ? Number(rows[0].total) : 0;
  return { products: rows as unknown as AdminProductRow[], total };
}

// ---------------- Fiche utilisateur complete ----------------

export interface UserFull {
  profile: Profile;
  asClient: { orders: number; spent: number };
  vendor: (Vendor & { products: number; orders: number; revenue: number }) | null;
  driver: (Driver & { deliveries: number }) | null;
  recentOrders: { id: string; code: string; status: string; total: number; created_at: string }[];
}

export async function getUserFull(userId: string): Promise<UserFull | null> {
  try {
    return await getUserFullUnsafe(userId);
  } catch {
    return null;
  }
}

async function getUserFullUnsafe(userId: string): Promise<UserFull | null> {
  const [profile] = await sql<Profile[]>`
    select id, role, full_name, email, phone, avatar_url, address, lat, lng,
           account_status, email_verified, created_at, updated_at
    from users where id = ${userId} limit 1
  `;
  if (!profile) return null;

  const [client] = await sql<{ orders: number; spent: number }[]>`
    select count(*)::int as orders,
           coalesce(sum(total) filter (where status = 'delivered'), 0)::float8 as spent
    from orders where client_id = ${userId}
  `;

  const [vendor] = await sql<(Vendor & { products: number; orders: number; revenue: number })[]>`
    select v.id, v.user_id, v.shop_name, v.description, v.logo_url, v.status,
           v.address, v.lat, v.lng, v.rating_avg::float8 as rating_avg, v.rating_count,
           v.created_at, v.updated_at,
           (select count(*)::int from products p where p.vendor_id = v.id) as products,
           (select count(*)::int from orders o where o.vendor_id = v.id) as orders,
           (select coalesce(sum(o.total) filter (where o.status='delivered'),0)::float8
              from orders o where o.vendor_id = v.id) as revenue
    from vendors v where v.user_id = ${userId} limit 1
  `;

  const [driver] = await sql<(Driver & { deliveries: number })[]>`
    select d.id, d.user_id, d.status, d.cni_url, d.vehicle_doc_url, d.vehicle_type,
           d.is_available, d.lat, d.lng, d.last_seen_at,
           d.rating_avg::float8 as rating_avg, d.rating_count, d.created_at, d.updated_at,
           (select count(*)::int from orders o where o.driver_id = d.id and o.status='delivered') as deliveries
    from drivers d where d.user_id = ${userId} limit 1
  `;

  const recentOrders = await sql<
    { id: string; code: string; status: string; total: number; created_at: string }[]
  >`
    select id, code, status, total::float8 as total, created_at
    from orders where client_id = ${userId}
    order by created_at desc limit 6
  `;

  return {
    profile,
    asClient: client,
    vendor: vendor ?? null,
    driver: driver ?? null,
    recentOrders,
  };
}

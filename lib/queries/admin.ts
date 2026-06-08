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

export async function listUsers(role?: string): Promise<Profile[]> {
  const roleFilter = role ? sql`where role = ${role}` : sql``;
  return await sql<Profile[]>`
    select id, role, full_name, email, phone, avatar_url, address,
           lat, lng, account_status, created_at, updated_at
    from users ${roleFilter}
    order by created_at desc limit 200
  `;
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

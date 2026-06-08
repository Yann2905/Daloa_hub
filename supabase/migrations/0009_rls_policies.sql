-- =========================================================================
-- DALOA HUB - 0009 Row Level Security (RBAC au niveau base)
-- =========================================================================

-- Helpers (SECURITY DEFINER => evitent la recursion RLS sur profiles)
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Resout le vendor_id de l'utilisateur courant
create or replace function public.my_vendor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.vendors where user_id = auth.uid();
$$;

-- Resout le driver_id de l'utilisateur courant
create or replace function public.my_driver_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.drivers where user_id = auth.uid();
$$;

-- Active RLS partout
alter table public.profiles            enable row level security;
alter table public.vendors             enable row level security;
alter table public.drivers             enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_status_history enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.payments            enable row level security;
alter table public.ratings             enable row level security;
alter table public.reviews             enable row level security;
alter table public.reports             enable row level security;
alter table public.notifications       enable row level security;
alter table public.push_subscriptions  enable row level security;

-- ---------------- PROFILES ----------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- VENDORS ----------------
-- Boutiques approuvees visibles de tous ; le vendeur voit la sienne ; admin tout
drop policy if exists vendors_select_public on public.vendors;
create policy vendors_select_public on public.vendors
  for select using (
    status = 'approved' or user_id = auth.uid() or public.is_admin()
  );

drop policy if exists vendors_update_own on public.vendors;
create policy vendors_update_own on public.vendors
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists vendors_admin_all on public.vendors;
create policy vendors_admin_all on public.vendors
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- DRIVERS ----------------
drop policy if exists drivers_select on public.drivers;
create policy drivers_select on public.drivers
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists drivers_update_own on public.drivers;
create policy drivers_update_own on public.drivers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists drivers_admin_all on public.drivers;
create policy drivers_admin_all on public.drivers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- CATEGORIES ----------------
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- PRODUCTS ----------------
-- Visibles si actifs (boutique approuvee) ; le vendeur gere les siens
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
  for select using (
    is_active
    or vendor_id = public.my_vendor_id()
    or public.is_admin()
  );

drop policy if exists products_vendor_write on public.products;
create policy products_vendor_write on public.products
  for all using (vendor_id = public.my_vendor_id())
  with check (vendor_id = public.my_vendor_id());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- PRODUCT IMAGES ----------------
drop policy if exists product_images_select on public.product_images;
create policy product_images_select on public.product_images
  for select using (true);

drop policy if exists product_images_vendor_write on public.product_images;
create policy product_images_vendor_write on public.product_images
  for all using (
    exists (select 1 from public.products p
            where p.id = product_id and p.vendor_id = public.my_vendor_id())
  ) with check (
    exists (select 1 from public.products p
            where p.id = product_id and p.vendor_id = public.my_vendor_id())
  );

-- ---------------- ORDERS ----------------
-- Client, vendeur concerne, livreur affecte, admin
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (
    client_id = auth.uid()
    or vendor_id = public.my_vendor_id()
    or driver_id = public.my_driver_id()
    or public.is_admin()
  );

-- Le client cree ses propres commandes
drop policy if exists orders_insert_client on public.orders;
create policy orders_insert_client on public.orders
  for insert with check (client_id = auth.uid());

-- Mise a jour par les parties prenantes (transitions controlees cote serveur)
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update using (
    vendor_id = public.my_vendor_id()
    or driver_id = public.my_driver_id()
    or client_id = auth.uid()
    or public.is_admin()
  );

-- ---------------- ORDER ITEMS ----------------
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (
      o.client_id = auth.uid()
      or o.vendor_id = public.my_vendor_id()
      or o.driver_id = public.my_driver_id()
      or public.is_admin()
    ))
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            where o.id = order_id and o.client_id = auth.uid())
  );

-- ---------------- ORDER STATUS HISTORY ----------------
drop policy if exists order_history_select on public.order_status_history;
create policy order_history_select on public.order_status_history
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (
      o.client_id = auth.uid()
      or o.vendor_id = public.my_vendor_id()
      or o.driver_id = public.my_driver_id()
      or public.is_admin()
    ))
  );

-- ---------------- SUBSCRIPTIONS ----------------
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (vendor_id = public.my_vendor_id() or public.is_admin());

drop policy if exists subscriptions_admin on public.subscriptions;
create policy subscriptions_admin on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- PAYMENTS ----------------
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- RATINGS ----------------
drop policy if exists ratings_select_all on public.ratings;
create policy ratings_select_all on public.ratings
  for select using (true);

drop policy if exists ratings_insert_client on public.ratings;
create policy ratings_insert_client on public.ratings
  for insert with check (rater_id = auth.uid());

-- ---------------- REVIEWS ----------------
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews
  for select using (true);

drop policy if exists reviews_insert_client on public.reviews;
create policy reviews_insert_client on public.reviews
  for insert with check (client_id = auth.uid());

-- ---------------- REPORTS ----------------
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_admin on public.reports;
create policy reports_admin on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- NOTIFICATIONS ----------------
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------- PUSH SUBSCRIPTIONS ----------------
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

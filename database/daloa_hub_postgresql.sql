-- =========================================================================
-- DALOA HUB - BASE DE DONNEES COMPLETE (PostgreSQL standard)
-- Compatible Neon / Xata / CockroachDB / tout PostgreSQL >= 14
-- -------------------------------------------------------------------------
-- Difference avec la version Supabase :
--   * Table "users" autonome (remplace auth.users + profiles)
--   * Pas de RLS / storage / realtime Supabase
--   * La securite est appliquee cote application (verification du role)
--   * Les mots de passe sont stockes hashes (bcrypt/argon2) PAR L'APPLICATION
--
-- Execution : copier-coller dans le SQL Editor de Neon, OU
--   psql "VOTRE_CONNECTION_STRING" -f database/daloa_hub_postgresql.sql
-- =========================================================================

begin;

-- -------------------------------------------------------------------------
-- 0. EXTENSIONS
-- -------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- recherche texte instantanee

-- -------------------------------------------------------------------------
-- 1. TYPES ENUMERES
-- -------------------------------------------------------------------------
do $$ begin create type user_role as enum ('client','vendor','driver','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type account_status as enum ('active','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type driver_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type vendor_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type order_status as enum ('pending','confirmed','preparing','delivering','delivered','refused'); exception when duplicate_object then null; end $$;
do $$ begin create type delivery_type as enum ('standard','bulky'); exception when duplicate_object then null; end $$;
do $$ begin create type fulfillment_type as enum ('delivery','pickup'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('pending','paid','failed','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_purpose as enum ('order','subscription','delivery_fee'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_status as enum ('active','expired','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type report_type as enum ('scam','non_conform','bad_behavior','other'); exception when duplicate_object then null; end $$;
do $$ begin create type report_status as enum ('open','reviewing','resolved','dismissed'); exception when duplicate_object then null; end $$;
do $$ begin create type rating_target as enum ('vendor','driver'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum (
  'new_order','order_accepted','driver_assigned','delivery_completed','order_refused',
  'subscription_expired','driver_approved','driver_rejected','vendor_approved','report_received','new_message'
); exception when duplicate_object then null; end $$;

-- Fonction utilitaire : maintien de updated_at
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- -------------------------------------------------------------------------
-- 2. UTILISATEURS (compte + profil)
-- -------------------------------------------------------------------------
create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  password_hash  text not null,                 -- hash gere par l'application (bcrypt/argon2)
  role           user_role not null default 'client',
  full_name      text not null,
  phone          text,
  avatar_url     text,
  address        text,
  lat            double precision,
  lng            double precision,
  account_status account_status not null default 'active',
  email_verified boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Jetons a usage unique (verification email, reinitialisation mot de passe)
create table if not exists email_tokens (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  purpose    text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_users_role on users(role);
create index if not exists idx_users_status on users(account_status);
drop trigger if exists trg_users_updated on users;
create trigger trg_users_updated before update on users for each row execute function set_updated_at();

-- -------------------------------------------------------------------------
-- 3. VENDEURS
-- -------------------------------------------------------------------------
create table if not exists vendors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references users(id) on delete cascade,
  shop_name    text not null,
  description  text,
  logo_url     text,
  status       vendor_status not null default 'pending',
  address      text,
  lat          double precision,
  lng          double precision,
  rating_avg   numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_vendors_status on vendors(status);
drop trigger if exists trg_vendors_updated on vendors;
create trigger trg_vendors_updated before update on vendors for each row execute function set_updated_at();

-- -------------------------------------------------------------------------
-- 4. LIVREURS
-- -------------------------------------------------------------------------
create table if not exists drivers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references users(id) on delete cascade,
  status          driver_status not null default 'pending',
  cni_url         text,
  vehicle_doc_url text,
  vehicle_type    text,
  is_available    boolean not null default false,
  lat             double precision,
  lng             double precision,
  last_seen_at    timestamptz,
  rating_avg      numeric(3,2) not null default 0,
  rating_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_drivers_status on drivers(status);
create index if not exists idx_drivers_available on drivers(is_available) where is_available = true;
drop trigger if exists trg_drivers_updated on drivers;
create trigger trg_drivers_updated before update on drivers for each row execute function set_updated_at();

-- -------------------------------------------------------------------------
-- 5. CATEGORIES
-- -------------------------------------------------------------------------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 6. PRODUITS & IMAGES
-- -------------------------------------------------------------------------
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors(id) on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(12,2) not null check (price >= 0),
  stock        integer not null default 0 check (stock >= 0),
  is_bulky     boolean not null default false,
  is_active    boolean not null default true,
  rating_avg   numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_products_vendor on products(vendor_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(is_active) where is_active = true;
create index if not exists idx_products_price on products(price);
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);
drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products for each row execute function set_updated_at();

create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on product_images(product_id);

-- -------------------------------------------------------------------------
-- 7. COMMANDES
-- -------------------------------------------------------------------------
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  client_id         uuid not null references users(id) on delete restrict,
  vendor_id         uuid not null references vendors(id) on delete restrict,
  driver_id         uuid references drivers(id) on delete set null,
  status            order_status not null default 'pending',
  delivery_type     delivery_type not null default 'standard',
  fulfillment_type  fulfillment_type not null default 'delivery',
  subtotal          numeric(12,2) not null default 0,
  delivery_fee      numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  distance_km       numeric(8,2) not null default 0,
  dest_lat          double precision,
  dest_lng          double precision,
  dest_address      text,
  refused           boolean not null default false,
  refusal_reason    text,
  delivery_fee_paid boolean not null default false,
  vendor_settled    boolean not null default false, -- argent remis au vendeur (cash)
  settled_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  confirmed_at      timestamptz,
  delivered_at      timestamptz
);
create index if not exists idx_orders_client on orders(client_id);
create index if not exists idx_orders_vendor on orders(vendor_id);
create index if not exists idx_orders_driver on orders(driver_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  unit_price  numeric(12,2) not null,
  quantity    integer not null check (quantity > 0),
  line_total  numeric(12,2) not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

create table if not exists order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     order_status not null,
  note       text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_history_order on order_status_history(order_id, created_at);

-- -------------------------------------------------------------------------
-- 8. ABONNEMENTS & PAIEMENTS
-- -------------------------------------------------------------------------
create table if not exists subscriptions (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references vendors(id) on delete cascade,
  amount     numeric(12,2) not null default 1000,
  status     subscription_status not null default 'active',
  start_date timestamptz not null default now(),
  end_date   timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_vendor on subscriptions(vendor_id);
create index if not exists idx_subscriptions_status on subscriptions(status);
create index if not exists idx_subscriptions_end on subscriptions(end_date);
drop trigger if exists trg_subscriptions_updated on subscriptions;
create trigger trg_subscriptions_updated before update on subscriptions for each row execute function set_updated_at();

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  purpose         payment_purpose not null,
  amount          numeric(12,2) not null check (amount >= 0),
  status          payment_status not null default 'pending',
  user_id         uuid references users(id) on delete set null,
  order_id        uuid references orders(id) on delete set null,
  subscription_id uuid references subscriptions(id) on delete set null,
  method          text,
  reference       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_payments_purpose on payments(purpose);
create index if not exists idx_payments_status on payments(status);
drop trigger if exists trg_payments_updated on payments;
create trigger trg_payments_updated before update on payments for each row execute function set_updated_at();

-- -------------------------------------------------------------------------
-- 9. EVALUATIONS, AVIS, SIGNALEMENTS
-- -------------------------------------------------------------------------
create table if not exists ratings (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  rater_id    uuid not null references users(id) on delete cascade,
  target_type rating_target not null,
  target_id   uuid not null,
  stars       smallint not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (order_id, target_type)
);
create index if not exists idx_ratings_target on ratings(target_type, target_id);

create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  order_id   uuid references orders(id) on delete set null,
  client_id  uuid not null references users(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_product on reviews(product_id);

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete set null,
  reporter_id uuid not null references users(id) on delete cascade,
  type        report_type not null,
  message     text,
  status      report_status not null default 'open',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_reports_status on reports(status);
drop trigger if exists trg_reports_updated on reports;
create trigger trg_reports_updated before update on reports for each row execute function set_updated_at();

-- -------------------------------------------------------------------------
-- 10. NOTIFICATIONS & PUSH
-- -------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where is_read = false;

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Limitation anti-brute-force (connexion)
create table if not exists login_attempts (
  key        text primary key,
  attempts   integer not null default 0,
  reset_at   timestamptz not null
);

-- Chat (negociation client <-> vendeur)
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references users(id) on delete cascade,
  vendor_id       uuid not null references vendors(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (client_id, vendor_id)
);
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references users(id) on delete cascade,
  body            text not null,
  product_id      uuid references products(id) on delete set null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conv on messages(conversation_id, created_at);
create index if not exists idx_conv_client on conversations(client_id, last_message_at desc);
create index if not exists idx_conv_vendor on conversations(vendor_id, last_message_at desc);

-- -------------------------------------------------------------------------
-- 11. TRIGGERS METIER
-- -------------------------------------------------------------------------
-- Code commande lisible : DH-YYMMDD-XXXX
create or replace function gen_order_code() returns trigger language plpgsql as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'DH-' || to_char(now(),'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_code on orders;
create trigger trg_orders_code before insert on orders for each row execute function gen_order_code();

-- Historisation des statuts
create or replace function log_order_status() returns trigger language plpgsql as $$
begin
  if (tg_op='INSERT') or (new.status is distinct from old.status) then
    insert into order_status_history(order_id,status) values (new.id,new.status);
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_status_log on orders;
create trigger trg_orders_status_log after insert or update on orders for each row execute function log_order_status();

-- Recalcul note vendeur/livreur
create or replace function recompute_rating() returns trigger language plpgsql as $$
declare v_type rating_target; v_id uuid; v_avg numeric(3,2); v_count integer;
begin
  v_type := coalesce(new.target_type, old.target_type);
  v_id   := coalesce(new.target_id, old.target_id);
  select round(avg(stars)::numeric,2), count(*) into v_avg, v_count
    from ratings where target_type=v_type and target_id=v_id;
  if v_type='vendor' then update vendors set rating_avg=coalesce(v_avg,0), rating_count=v_count where id=v_id;
  elsif v_type='driver' then update drivers set rating_avg=coalesce(v_avg,0), rating_count=v_count where id=v_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_ratings_recompute on ratings;
create trigger trg_ratings_recompute after insert or update or delete on ratings for each row execute function recompute_rating();

-- Recalcul note produit
create or replace function recompute_product_rating() returns trigger language plpgsql as $$
declare v_product uuid; v_avg numeric(3,2); v_count integer;
begin
  v_product := coalesce(new.product_id, old.product_id);
  select round(avg(stars)::numeric,2), count(*) into v_avg, v_count from reviews where product_id=v_product;
  update products set rating_avg=coalesce(v_avg,0), rating_count=v_count where id=v_product;
  return null;
end $$;
drop trigger if exists trg_reviews_recompute on reviews;
create trigger trg_reviews_recompute after insert or update or delete on reviews for each row execute function recompute_product_rating();

-- Decrement du stock a l'ajout d'une ligne de commande
create or replace function decrement_stock() returns trigger language plpgsql as $$
begin
  update products set stock = greatest(stock - new.quantity, 0) where id = new.product_id;
  return new;
end $$;
drop trigger if exists trg_order_items_stock on order_items;
create trigger trg_order_items_stock after insert on order_items for each row execute function decrement_stock();

-- Reintegration du stock au refus
create or replace function restock_on_refusal() returns trigger language plpgsql as $$
begin
  if new.status='refused' and old.status is distinct from 'refused' then
    update products p set stock = p.stock + oi.quantity
      from order_items oi where oi.order_id=new.id and oi.product_id=p.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_restock on orders;
create trigger trg_orders_restock after update on orders for each row execute function restock_on_refusal();

-- -------------------------------------------------------------------------
-- 12. FONCTIONS METIER (RPC)
-- -------------------------------------------------------------------------
-- Creer une notification
create or replace function notify_user(p_user_id uuid, p_type notification_type,
  p_title text, p_body text default null, p_data jsonb default '{}'::jsonb)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into notifications(user_id,type,title,body,data)
  values (p_user_id,p_type,p_title,p_body,p_data) returning id into v_id;
  return v_id;
end $$;

-- Passer une commande de maniere transactionnelle
-- p_items : jsonb [{ "product_id": "...", "quantity": N }]
create or replace function place_order(
  p_client_id uuid, p_vendor_id uuid, p_items jsonb,
  p_dest_lat double precision, p_dest_lng double precision, p_dest_address text,
  p_delivery_type delivery_type, p_delivery_fee numeric, p_distance_km numeric
) returns uuid language plpgsql as $$
declare
  v_order_id uuid; v_subtotal numeric(12,2):=0; v_item jsonb;
  v_product record; v_qty integer; v_vendor_user uuid;
begin
  select user_id into v_vendor_user from vendors where id=p_vendor_id and status='approved';
  if v_vendor_user is null then raise exception 'Boutique indisponible'; end if;

  insert into orders(client_id,vendor_id,status,delivery_type,delivery_fee,distance_km,dest_lat,dest_lng,dest_address)
  values (p_client_id,p_vendor_id,'pending',p_delivery_type,coalesce(p_delivery_fee,0),
          coalesce(p_distance_km,0),p_dest_lat,p_dest_lng,p_dest_address)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select id,name,price,stock into v_product from products
      where id=(v_item->>'product_id')::uuid and vendor_id=p_vendor_id and is_active=true for update;
    if v_product.id is null then raise exception 'Produit indisponible'; end if;
    if v_product.stock < v_qty then raise exception 'Stock insuffisant pour %', v_product.name; end if;
    insert into order_items(order_id,product_id,name,unit_price,quantity,line_total)
    values (v_order_id,v_product.id,v_product.name,v_product.price,v_qty,v_product.price*v_qty);
    v_subtotal := v_subtotal + v_product.price*v_qty;
  end loop;

  update orders set subtotal=v_subtotal, total=v_subtotal+coalesce(p_delivery_fee,0) where id=v_order_id;
  perform notify_user(v_vendor_user,'new_order','Nouvelle commande',
    'Vous avez recu une nouvelle commande.', jsonb_build_object('order_id',v_order_id));
  return v_order_id;
end $$;

-- Affecter le livreur disponible le plus proche
create or replace function assign_nearest_driver(p_order_id uuid)
returns uuid language plpgsql as $$
declare v_lat double precision; v_lng double precision; v_driver record;
begin
  select dest_lat,dest_lng into v_lat,v_lng from orders where id=p_order_id;
  if v_lat is null or v_lng is null then return null; end if;
  select d.id,d.user_id into v_driver from drivers d
    where d.status='approved' and d.is_available=true and d.lat is not null and d.lng is not null
    order by ((d.lat-v_lat)^2 + (d.lng-v_lng)^2) asc limit 1;
  if v_driver.id is null then return null; end if;
  update orders set driver_id=v_driver.id,
    status=case when status='pending' then 'confirmed' else status end where id=p_order_id;
  perform notify_user(v_driver.user_id,'driver_assigned','Nouvelle livraison',
    'Une commande vous a ete affectee.', jsonb_build_object('order_id',p_order_id));
  return v_driver.id;
end $$;

-- Refus produit : seuls les frais de deplacement sont dus (stock reintegre par trigger)
create or replace function refuse_order(p_order_id uuid, p_reason text)
returns void language plpgsql as $$
declare v_vendor_user uuid;
begin
  select v.user_id into v_vendor_user from orders o join vendors v on v.id=o.vendor_id where o.id=p_order_id;
  update orders set status='refused', refused=true, refusal_reason=p_reason, delivery_fee_paid=true
    where id=p_order_id;
  if v_vendor_user is not null then
    perform notify_user(v_vendor_user,'order_refused','Commande refusee',
      'Le client a refuse la commande. Les frais de deplacement restent dus.',
      jsonb_build_object('order_id',p_order_id));
  end if;
end $$;

-- Expiration des abonnements (a appeler par un cron quotidien)
create or replace function expire_subscriptions()
returns integer language plpgsql as $$
declare v_count integer:=0;
begin
  with expired as (
    update subscriptions s set status='expired'
    where s.status='active' and s.end_date < now() returning s.vendor_id
  )
  update vendors v set status='pending' from expired e
  where v.id=e.vendor_id and v.status='approved';
  get diagnostics v_count = row_count;

  insert into notifications(user_id,type,title,body)
  select v.user_id,'subscription_expired','Abonnement expire','Veuillez renouveler votre abonnement.'
  from subscriptions s join vendors v on v.id=s.vendor_id
  where s.status='expired' and s.end_date < now() and s.end_date > now() - interval '1 day';
  return v_count;
end $$;

-- -------------------------------------------------------------------------
-- 13. DONNEES DE REFERENCE (categories)
-- -------------------------------------------------------------------------
insert into categories(slug,name,position) values
  ('mode','Mode',1),('chaussures','Chaussures',2),('telephones','Telephones',3),
  ('informatique','Informatique',4),('electronique','Electronique',5),('maison','Maison',6)
on conflict (slug) do nothing;

commit;

-- =========================================================================
-- FIN. Base prete. Creez ensuite un admin (mot de passe hashe par l'app) :
--   insert into users(email,password_hash,role,full_name)
--   values ('admin@daloahub.ci','<HASH>','admin','Administrateur');
-- =========================================================================

-- =========================================================================
-- DALOA HUB - 0004 Commandes : orders, order_items, order_status_history
-- =========================================================================

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  client_id        uuid not null references public.profiles(id) on delete restrict,
  vendor_id        uuid not null references public.vendors(id) on delete restrict,
  driver_id        uuid references public.drivers(id) on delete set null,
  status           order_status not null default 'pending',
  delivery_type    delivery_type not null default 'standard',
  subtotal         numeric(12,2) not null default 0,
  delivery_fee     numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  distance_km      numeric(8,2) not null default 0,
  -- Destination de livraison (position client)
  dest_lat         double precision,
  dest_lng         double precision,
  dest_address     text,
  -- Refus produit : seuls les frais de deplacement sont dus
  refused          boolean not null default false,
  refusal_reason   text,
  delivery_fee_paid boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  delivered_at     timestamptz
);

create index if not exists idx_orders_client on public.orders(client_id);
create index if not exists idx_orders_vendor on public.orders(vendor_id);
create index if not exists idx_orders_driver on public.orders(driver_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function set_updated_at();

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,            -- snapshot au moment de la commande
  unit_price  numeric(12,2) not null,   -- snapshot
  quantity    integer not null check (quantity > 0),
  line_total  numeric(12,2) not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);

-- Historique complet des changements de statut
create table if not exists public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     order_status not null,
  note       text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_history_order
  on public.order_status_history(order_id, created_at);

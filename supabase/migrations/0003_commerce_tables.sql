-- =========================================================================
-- DALOA HUB - 0003 Commerce : products, product_images
-- =========================================================================

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(12,2) not null check (price >= 0),
  stock        integer not null default 0 check (stock >= 0),
  is_bulky     boolean not null default false,   -- force le tarif VOLUMINEUX
  is_active    boolean not null default true,
  rating_avg   numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_products_vendor on public.products(vendor_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active)
  where is_active = true;
create index if not exists idx_products_price on public.products(price);
-- Recherche texte instantanee (trigram) sur nom + description
create index if not exists idx_products_name_trgm
  on public.products using gin (name gin_trgm_ops);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function set_updated_at();

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product
  on public.product_images(product_id);

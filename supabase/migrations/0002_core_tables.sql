-- =========================================================================
-- DALOA HUB - 0002 Tables coeur : profiles, vendors, drivers, categories
-- =========================================================================

-- Profils utilisateurs (extension de auth.users gere par Supabase Auth)
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           user_role not null default 'client',
  full_name      text not null,
  email          text,
  phone          text,
  avatar_url     text,
  address        text,
  lat            double precision,
  lng            double precision,
  account_status account_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(account_status);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function set_updated_at();

-- Boutiques (vendeurs)
create table if not exists public.vendors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
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

create index if not exists idx_vendors_status on public.vendors(status);
create index if not exists idx_vendors_user on public.vendors(user_id);

drop trigger if exists trg_vendors_updated on public.vendors;
create trigger trg_vendors_updated before update on public.vendors
  for each row execute function set_updated_at();

-- Livreurs
create table if not exists public.drivers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  status        driver_status not null default 'pending',
  cni_url       text,          -- carte nationale d'identite
  vehicle_doc_url text,        -- document du vehicule
  vehicle_type  text,
  is_available  boolean not null default false,
  lat           double precision,
  lng           double precision,
  last_seen_at  timestamptz,
  rating_avg    numeric(3,2) not null default 0,
  rating_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_drivers_status on public.drivers(status);
create index if not exists idx_drivers_available on public.drivers(is_available)
  where is_available = true;

drop trigger if exists trg_drivers_updated on public.drivers;
create trigger trg_drivers_updated before update on public.drivers
  for each row execute function set_updated_at();

-- Categories produits
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

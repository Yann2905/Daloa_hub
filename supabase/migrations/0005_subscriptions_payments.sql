-- =========================================================================
-- DALOA HUB - 0005 Abonnements & paiements
-- =========================================================================

create table if not exists public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  amount     numeric(12,2) not null default 1000,
  status     subscription_status not null default 'active',
  start_date timestamptz not null default now(),
  end_date   timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_vendor on public.subscriptions(vendor_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_end on public.subscriptions(end_date);

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function set_updated_at();

create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  purpose         payment_purpose not null,
  amount          numeric(12,2) not null check (amount >= 0),
  status          payment_status not null default 'pending',
  user_id         uuid references public.profiles(id) on delete set null,
  order_id        uuid references public.orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  method          text,        -- ex: mobile_money, cash, card
  reference       text,        -- reference operateur
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_purpose on public.payments(purpose);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_created on public.payments(created_at desc);

drop trigger if exists trg_payments_updated on public.payments;
create trigger trg_payments_updated before update on public.payments
  for each row execute function set_updated_at();

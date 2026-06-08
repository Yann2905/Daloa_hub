-- =========================================================================
-- DALOA HUB - 0006 Evaluations, avis produits, signalements
-- =========================================================================

-- Notation vendeur / livreur apres livraison (1 a 5 etoiles)
create table if not exists public.ratings (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  rater_id    uuid not null references public.profiles(id) on delete cascade,
  target_type rating_target not null,
  target_id   uuid not null,   -- vendor_id ou driver_id
  stars       smallint not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  -- un client ne note qu'une fois chaque cible par commande
  unique (order_id, target_type)
);

create index if not exists idx_ratings_target
  on public.ratings(target_type, target_id);
create index if not exists idx_ratings_order on public.ratings(order_id);

-- Avis produits
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id   uuid references public.orders(id) on delete set null,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_client on public.reviews(client_id);

-- Signalements d'un probleme sur une commande
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references public.orders(id) on delete set null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  type        report_type not null,
  message     text,
  status      report_status not null default 'open',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_order on public.reports(order_id);

drop trigger if exists trg_reports_updated on public.reports;
create trigger trg_reports_updated before update on public.reports
  for each row execute function set_updated_at();

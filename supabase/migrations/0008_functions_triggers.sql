-- =========================================================================
-- DALOA HUB - 0008 Fonctions metier & triggers
-- =========================================================================

-- -------------------------------------------------------------------------
-- Creation automatique du profil a l'inscription Supabase Auth.
-- Le role et le nom sont passes via user_metadata cote application.
-- -------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'client');

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  -- Profil metier associe selon le role
  if v_role = 'vendor' then
    insert into public.vendors (user_id, shop_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'shop_name', 'Ma boutique'))
    on conflict (user_id) do nothing;
  elsif v_role = 'driver' then
    insert into public.drivers (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------------
-- Generation d'un code commande lisible : DH-YYMMDD-XXXX
-- -------------------------------------------------------------------------
create or replace function public.gen_order_code()
returns trigger language plpgsql as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'DH-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_code on public.orders;
create trigger trg_orders_code before insert on public.orders
  for each row execute function public.gen_order_code();

-- -------------------------------------------------------------------------
-- Journalisation automatique des changements de statut commande
-- -------------------------------------------------------------------------
create or replace function public.log_order_status()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status)
    values (new.id, new.status);
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_status_log on public.orders;
create trigger trg_orders_status_log after insert or update on public.orders
  for each row execute function public.log_order_status();

-- -------------------------------------------------------------------------
-- Recalcul de la moyenne d'evaluation d'une cible (vendor / driver)
-- -------------------------------------------------------------------------
create or replace function public.recompute_rating()
returns trigger language plpgsql as $$
declare
  v_target_type rating_target;
  v_target_id uuid;
  v_avg numeric(3,2);
  v_count integer;
begin
  v_target_type := coalesce(new.target_type, old.target_type);
  v_target_id := coalesce(new.target_id, old.target_id);

  select round(avg(stars)::numeric, 2), count(*)
    into v_avg, v_count
    from public.ratings
   where target_type = v_target_type and target_id = v_target_id;

  if v_target_type = 'vendor' then
    update public.vendors
       set rating_avg = coalesce(v_avg, 0), rating_count = v_count
     where id = v_target_id;
  elsif v_target_type = 'driver' then
    update public.drivers
       set rating_avg = coalesce(v_avg, 0), rating_count = v_count
     where id = v_target_id;
  end if;

  return null;
end $$;

drop trigger if exists trg_ratings_recompute on public.ratings;
create trigger trg_ratings_recompute
  after insert or update or delete on public.ratings
  for each row execute function public.recompute_rating();

-- -------------------------------------------------------------------------
-- Recalcul de la moyenne d'avis produit
-- -------------------------------------------------------------------------
create or replace function public.recompute_product_rating()
returns trigger language plpgsql as $$
declare
  v_product uuid;
  v_avg numeric(3,2);
  v_count integer;
begin
  v_product := coalesce(new.product_id, old.product_id);
  select round(avg(stars)::numeric, 2), count(*)
    into v_avg, v_count
    from public.reviews where product_id = v_product;
  update public.products
     set rating_avg = coalesce(v_avg, 0), rating_count = v_count
   where id = v_product;
  return null;
end $$;

drop trigger if exists trg_reviews_recompute on public.reviews;
create trigger trg_reviews_recompute
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_product_rating();

-- -------------------------------------------------------------------------
-- Gestion du stock : decrement a la creation d'une ligne, reintegration au refus
-- -------------------------------------------------------------------------
create or replace function public.decrement_stock()
returns trigger language plpgsql as $$
begin
  update public.products
     set stock = greatest(stock - new.quantity, 0)
   where id = new.product_id;
  return new;
end $$;

drop trigger if exists trg_order_items_stock on public.order_items;
create trigger trg_order_items_stock after insert on public.order_items
  for each row execute function public.decrement_stock();

-- Reintegration automatique du stock lorsqu'une commande passe a 'refused'
create or replace function public.restock_on_refusal()
returns trigger language plpgsql as $$
begin
  if new.status = 'refused' and old.status is distinct from 'refused' then
    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_restock on public.orders;
create trigger trg_orders_restock after update on public.orders
  for each row execute function public.restock_on_refusal();

-- -------------------------------------------------------------------------
-- Helper : creer une notification (utilisable depuis d'autres fonctions/RPC)
-- -------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_body text default null,
  p_data jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data)
  returning id into v_id;
  return v_id;
end $$;

-- -------------------------------------------------------------------------
-- Expiration des abonnements (appelee par le cron quotidien)
-- Masque les vendeurs dont l'abonnement actif est arrive a echeance.
-- -------------------------------------------------------------------------
create or replace function public.expire_subscriptions()
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  with expired as (
    update public.subscriptions s
       set status = 'expired'
     where s.status = 'active' and s.end_date < now()
     returning s.vendor_id
  )
  update public.vendors v
     set status = 'pending'  -- masque la boutique tant que non renouvele
    from expired e
   where v.id = e.vendor_id
     and v.status = 'approved';

  get diagnostics v_count = row_count;

  -- Notifie chaque vendeur expire
  insert into public.notifications (user_id, type, title, body)
  select v.user_id, 'subscription_expired', 'Abonnement expire',
         'Veuillez renouveler votre abonnement.'
    from public.subscriptions s
    join public.vendors v on v.id = s.vendor_id
   where s.status = 'expired'
     and s.end_date < now()
     and s.end_date > now() - interval '1 day';

  return v_count;
end $$;

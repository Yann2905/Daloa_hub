-- =========================================================================
-- DALOA HUB - 0001 Extensions & types enumeres
-- =========================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- recherche texte instantanee

-- Roles applicatifs (RBAC)
do $$ begin
  create type user_role as enum ('client', 'vendor', 'driver', 'admin');
exception when duplicate_object then null; end $$;

-- Statut d'un compte
do $$ begin
  create type account_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

-- Statut de validation livreur
do $$ begin
  create type driver_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Statut de validation vendeur
do $$ begin
  create type vendor_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Cycle de vie d'une commande
do $$ begin
  create type order_status as enum (
    'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'refused'
  );
exception when duplicate_object then null; end $$;

-- Type de livraison (tarification automatique)
do $$ begin
  create type delivery_type as enum ('standard', 'bulky');
exception when duplicate_object then null; end $$;

-- Paiements
do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_purpose as enum ('order', 'subscription', 'delivery_fee');
exception when duplicate_object then null; end $$;

-- Abonnements
do $$ begin
  create type subscription_status as enum ('active', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

-- Signalements
do $$ begin
  create type report_type as enum ('scam', 'non_conform', 'bad_behavior', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

-- Cible d'une evaluation
do $$ begin
  create type rating_target as enum ('vendor', 'driver');
exception when duplicate_object then null; end $$;

-- Types de notification temps reel
do $$ begin
  create type notification_type as enum (
    'new_order', 'order_accepted', 'driver_assigned', 'delivery_completed',
    'order_refused', 'subscription_expired', 'driver_approved',
    'driver_rejected', 'vendor_approved', 'report_received'
  );
exception when duplicate_object then null; end $$;

-- Fonction utilitaire : maintien automatique de updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

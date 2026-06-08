-- =========================================================================
-- DALOA HUB - 0011 Storage buckets, Realtime, donnees de reference
-- =========================================================================

-- --- Buckets de stockage (Supabase Storage) ---
insert into storage.buckets (id, name, public)
values
  ('products', 'products', true),    -- images produits (publiques)
  ('avatars', 'avatars', true),      -- avatars utilisateurs
  ('shops', 'shops', true),          -- logos boutiques
  ('documents', 'documents', false)  -- CNI / docs vehicule (prives)
on conflict (id) do nothing;

-- Lecture publique des buckets publics
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('products', 'avatars', 'shops'));

-- Upload : utilisateur authentifie dans son propre dossier (prefix = user id)
drop policy if exists storage_auth_write on storage.objects;
create policy storage_auth_write on storage.objects
  for insert to authenticated with check (
    bucket_id in ('products', 'avatars', 'shops', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_auth_update on storage.objects;
create policy storage_auth_update on storage.objects
  for update to authenticated using (
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_auth_delete on storage.objects;
create policy storage_auth_delete on storage.objects
  for delete to authenticated using (
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Documents prives : lisibles par le proprietaire et les admins
drop policy if exists storage_documents_read on storage.objects;
create policy storage_documents_read on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- --- Realtime : publier les tables temps reel ---
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.drivers;
exception when others then null; end $$;

-- --- Categories de reference ---
insert into public.categories (slug, name, position) values
  ('mode', 'Mode', 1),
  ('chaussures', 'Chaussures', 2),
  ('telephones', 'Telephones', 3),
  ('informatique', 'Informatique', 4),
  ('electronique', 'Electronique', 5),
  ('maison', 'Maison', 6)
on conflict (slug) do nothing;

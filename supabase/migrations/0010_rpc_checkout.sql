-- =========================================================================
-- DALOA HUB - 0010 RPC checkout atomique + affectation livreur
-- =========================================================================

-- -------------------------------------------------------------------------
-- place_order : cree une commande complete de maniere transactionnelle.
-- Valide le stock, fige les prix, calcule les totaux cote serveur.
-- p_items : jsonb [{ product_id, quantity }]
-- Retourne l'id de la commande creee.
-- -------------------------------------------------------------------------
create or replace function public.place_order(
  p_vendor_id uuid,
  p_items jsonb,
  p_dest_lat double precision,
  p_dest_lng double precision,
  p_dest_address text,
  p_delivery_type delivery_type,
  p_delivery_fee numeric,
  p_distance_km numeric
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_item jsonb;
  v_product record;
  v_qty integer;
  v_vendor_user uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  -- La boutique doit etre approuvee (abonnement actif)
  select user_id into v_vendor_user from public.vendors
   where id = p_vendor_id and status = 'approved';
  if v_vendor_user is null then
    raise exception 'Boutique indisponible';
  end if;

  insert into public.orders (
    client_id, vendor_id, status, delivery_type,
    delivery_fee, distance_km, dest_lat, dest_lng, dest_address
  ) values (
    auth.uid(), p_vendor_id, 'pending', p_delivery_type,
    coalesce(p_delivery_fee, 0), coalesce(p_distance_km, 0),
    p_dest_lat, p_dest_lng, p_dest_address
  ) returning id into v_order_id;

  -- Lignes de commande (verrouillage stock)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    select id, name, price, stock into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and vendor_id = p_vendor_id
       and is_active = true
     for update;

    if v_product.id is null then
      raise exception 'Produit introuvable ou indisponible';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour %', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty,
            v_product.price * v_qty);
    -- (le trigger trg_order_items_stock decremente le stock)

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  update public.orders
     set subtotal = v_subtotal,
         total = v_subtotal + coalesce(p_delivery_fee, 0)
   where id = v_order_id;

  -- Notifie le vendeur d'une nouvelle commande
  perform public.notify_user(
    v_vendor_user, 'new_order', 'Nouvelle commande',
    'Vous avez recu une nouvelle commande.',
    jsonb_build_object('order_id', v_order_id)
  );

  return v_order_id;
end $$;

-- -------------------------------------------------------------------------
-- assign_nearest_driver : affecte le livreur disponible le plus proche.
-- Le calcul de distance se fait cote application (Haversine), mais on
-- expose ici une variante SQL pour fiabilite/temps reel.
-- Retourne le driver_id affecte (ou null).
-- -------------------------------------------------------------------------
create or replace function public.assign_nearest_driver(p_order_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_lat double precision;
  v_lng double precision;
  v_driver record;
begin
  select dest_lat, dest_lng into v_lat, v_lng
    from public.orders where id = p_order_id;
  if v_lat is null or v_lng is null then
    return null;
  end if;

  -- Distance euclidienne approchee (suffisant a l'echelle d'une ville)
  select d.id, d.user_id into v_driver
    from public.drivers d
   where d.status = 'approved'
     and d.is_available = true
     and d.lat is not null and d.lng is not null
   order by ((d.lat - v_lat)^2 + (d.lng - v_lng)^2) asc
   limit 1;

  if v_driver.id is null then
    return null;
  end if;

  update public.orders
     set driver_id = v_driver.id,
         status = case when status = 'pending' then 'confirmed' else status end
   where id = p_order_id;

  perform public.notify_user(
    v_driver.user_id, 'driver_assigned', 'Nouvelle livraison',
    'Une commande vous a ete affectee.',
    jsonb_build_object('order_id', p_order_id)
  );

  return v_driver.id;
end $$;

-- -------------------------------------------------------------------------
-- refuse_order : le client refuse a la livraison.
-- Seuls les frais de deplacement sont dus ; le stock est reintegre (trigger).
-- -------------------------------------------------------------------------
create or replace function public.refuse_order(p_order_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_client uuid; v_vendor_user uuid;
begin
  select o.client_id, v.user_id into v_client, v_vendor_user
    from public.orders o join public.vendors v on v.id = o.vendor_id
   where o.id = p_order_id;

  if v_client is null then raise exception 'Commande introuvable'; end if;
  if v_client <> auth.uid() and not public.is_admin() then
    raise exception 'Action non autorisee';
  end if;

  update public.orders
     set status = 'refused',
         refused = true,
         refusal_reason = p_reason,
         delivery_fee_paid = true   -- frais de deplacement dus
   where id = p_order_id;

  perform public.notify_user(
    v_vendor_user, 'order_refused', 'Commande refusee',
    'Le client a refuse la commande. Les frais de deplacement restent dus.',
    jsonb_build_object('order_id', p_order_id)
  );
end $$;

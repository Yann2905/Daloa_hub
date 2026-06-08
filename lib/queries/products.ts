import "server-only";
import { sql } from "@/lib/db";
import type { ProductWithImages, Category } from "@/lib/database.types";

export interface ProductFilters {
  search?: string;
  category?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  vendorId?: string;
  sort?: "recent" | "price_asc" | "price_desc";
  limit?: number;
}

// Selection commune : produit + images (json) + categorie + boutique
const PRODUCT_SELECT = sql`
  p.id, p.vendor_id, p.category_id, p.name, p.description,
  p.price::float8 as price, p.stock, p.is_bulky, p.is_active,
  p.rating_avg::float8 as rating_avg, p.rating_count,
  p.created_at, p.updated_at,
  coalesce(
    json_agg(json_build_object('id', pi.id, 'product_id', pi.product_id,
      'url', pi.url, 'position', pi.position) order by pi.position)
    filter (where pi.id is not null), '[]'
  ) as product_images,
  case when c.id is not null
    then json_build_object('slug', c.slug, 'name', c.name) end as categories,
  json_build_object('id', v.id, 'shop_name', v.shop_name,
    'rating_avg', v.rating_avg::float8) as vendors
`;

export async function listProducts(
  filters: ProductFilters = {},
): Promise<ProductWithImages[]> {
  try {
    // Conditions optionnelles interpolees directement (un seul niveau de
    // fragment) : la composition imbriquee n'est pas supportee par postgres.
    const order =
      filters.sort === "price_asc"
        ? sql`order by p.price asc`
        : filters.sort === "price_desc"
          ? sql`order by p.price desc`
          : sql`order by p.created_at desc`;

    const rows = await sql<ProductWithImages[]>`
      select ${PRODUCT_SELECT}
      from products p
      join vendors v on v.id = p.vendor_id
      left join categories c on c.id = p.category_id
      left join product_images pi on pi.product_id = p.id
      where p.is_active = true and v.status = 'approved'
        ${filters.search ? sql`and p.name ilike ${"%" + filters.search + "%"}` : sql``}
        ${filters.category ? sql`and c.slug = ${filters.category}` : sql``}
        ${filters.vendorId ? sql`and p.vendor_id = ${filters.vendorId}` : sql``}
        ${filters.minPrice != null ? sql`and p.price >= ${filters.minPrice}` : sql``}
        ${filters.maxPrice != null ? sql`and p.price <= ${filters.maxPrice}` : sql``}
        ${filters.inStock ? sql`and p.stock > 0` : sql``}
      group by p.id, c.id, v.id
      ${order}
      limit ${filters.limit ?? 60}
    `;
    return rows;
  } catch (e) {
    console.error("listProducts:", e);
    return [];
  }
}

export async function getProduct(id: string): Promise<ProductWithImages | null> {
  try {
    const rows = await sql<ProductWithImages[]>`
      select
        p.id, p.vendor_id, p.category_id, p.name, p.description,
        p.price::float8 as price, p.stock, p.is_bulky, p.is_active,
        p.rating_avg::float8 as rating_avg, p.rating_count,
        p.created_at, p.updated_at,
        coalesce(
          json_agg(json_build_object('id', pi.id, 'product_id', pi.product_id,
            'url', pi.url, 'position', pi.position) order by pi.position)
          filter (where pi.id is not null), '[]'
        ) as product_images,
        case when c.id is not null
          then json_build_object('slug', c.slug, 'name', c.name) end as categories,
        json_build_object('id', v.id, 'shop_name', v.shop_name,
          'rating_avg', v.rating_avg::float8, 'lat', v.lat, 'lng', v.lng,
          'address', v.address) as vendors
      from products p
      join vendors v on v.id = p.vendor_id
      left join categories c on c.id = p.category_id
      left join product_images pi on pi.product_id = p.id
      where p.id = ${id}
      group by p.id, c.id, v.id
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function listCategories(): Promise<Category[]> {
  try {
    return await sql<Category[]>`
      select id, slug, name, position, created_at
      from categories order by position
    `;
  } catch {
    return [];
  }
}

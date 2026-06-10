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
  page?: number;
  pageSize?: number;
}

// Selection commune : produit + images (json) + categorie + boutique
const PRODUCT_SELECT = sql`
  p.id, p.vendor_id, p.category_id, p.name, p.description,
  p.price::float8 as price, p.compare_at_price, p.options, p.stock, p.is_bulky, p.is_active,
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
    'rating_avg', v.rating_avg::float8, 'verified', v.verified) as vendors,
  count(*) over() as total_count
`;

export interface ProductPage {
  products: ProductWithImages[];
  total: number;
}

/** Produits similaires (meme categorie) pour la fiche produit. */
export async function listSimilarProducts(
  productId: string,
  categoryId: string | null,
  limit = 12,
): Promise<ProductWithImages[]> {
  try {
    const rows = await sql<(ProductWithImages & { total_count: number })[]>`
      select ${PRODUCT_SELECT}
      from products p
      join vendors v on v.id = p.vendor_id
      left join categories c on c.id = p.category_id
      left join product_images pi on pi.product_id = p.id
      where p.is_active = true and v.status = 'approved'
        and v.lat is not null and v.lng is not null
        and p.stock > 0 and p.id <> ${productId}
        ${categoryId ? sql`and p.category_id = ${categoryId}` : sql``}
      group by p.id, c.id, v.id
      order by p.created_at desc
      limit ${limit}
    `;
    return rows.map(({ total_count, ...p }) => {
      void total_count;
      return p as ProductWithImages;
    });
  } catch {
    return [];
  }
}

/** Produits favoris d'un utilisateur (les plus recents en premier). */
export async function listFavorites(userId: string): Promise<ProductWithImages[]> {
  try {
    const rows = await sql<(ProductWithImages & { total_count: number })[]>`
      select ${PRODUCT_SELECT}
      from favorites f
      join products p on p.id = f.product_id
      join vendors v on v.id = p.vendor_id
      left join categories c on c.id = p.category_id
      left join product_images pi on pi.product_id = p.id
      where f.user_id = ${userId} and p.is_active = true
      group by p.id, c.id, v.id, f.created_at
      order by f.created_at desc
    `;
    return rows.map(({ total_count, ...p }) => {
      void total_count;
      return p as ProductWithImages;
    });
  } catch {
    return [];
  }
}

export async function listProducts(
  filters: ProductFilters = {},
): Promise<ProductPage> {
  try {
    const pageSize = filters.pageSize ?? filters.limit ?? 24;
    const page = Math.max(1, filters.page ?? 1);
    const offset = (page - 1) * pageSize;
    // Conditions optionnelles interpolees directement (un seul niveau de
    // fragment) : la composition imbriquee n'est pas supportee par postgres.
    const order =
      filters.sort === "price_asc"
        ? sql`order by p.price asc`
        : filters.sort === "price_desc"
          ? sql`order by p.price desc`
          : sql`order by p.created_at desc`;

    const rows = await sql<(ProductWithImages & { total_count: number })[]>`
      select ${PRODUCT_SELECT}
      from products p
      join vendors v on v.id = p.vendor_id
      left join categories c on c.id = p.category_id
      left join product_images pi on pi.product_id = p.id
      where p.is_active = true and v.status = 'approved'
        and v.lat is not null and v.lng is not null
        and p.stock > 0
        ${filters.search ? sql`and p.name ilike ${"%" + filters.search + "%"}` : sql``}
        ${filters.category ? sql`and c.slug = ${filters.category}` : sql``}
        ${filters.vendorId ? sql`and p.vendor_id = ${filters.vendorId}` : sql``}
        ${filters.minPrice != null ? sql`and p.price >= ${filters.minPrice}` : sql``}
        ${filters.maxPrice != null ? sql`and p.price <= ${filters.maxPrice}` : sql``}
        ${filters.inStock ? sql`and p.stock > 0` : sql``}
      group by p.id, c.id, v.id
      ${order}
      limit ${pageSize} offset ${offset}
    `;
    const total = rows[0] ? Number(rows[0].total_count) : 0;
    const products = rows.map(({ total_count, ...p }) => {
      void total_count;
      return p as ProductWithImages;
    });
    return { products, total };
  } catch (e) {
    console.error("listProducts:", e);
    return { products: [], total: 0 };
  }
}

export async function getProduct(id: string): Promise<ProductWithImages | null> {
  try {
    const rows = await sql<ProductWithImages[]>`
      select
        p.id, p.vendor_id, p.category_id, p.name, p.description,
        p.price::float8 as price, p.compare_at_price, p.options, p.stock, p.is_bulky, p.is_active,
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
          'address', v.address, 'verified', v.verified) as vendors
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

import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";

function baseUrl() {
  const u = process.env.NEXT_PUBLIC_APP_URL;
  if (u && u.startsWith("http")) return u.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "https://daloa-hub.vercel.app";
}

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/produits`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/devenir-vendeur`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const products = await sql<{ id: string; updated_at: string }[]>`
      select p.id, p.updated_at from products p
      join vendors v on v.id = p.vendor_id
      where p.is_active = true and v.status = 'approved'
      order by p.updated_at desc limit 5000
    `;
    const shops = await sql<{ id: string; updated_at: string }[]>`
      select id, updated_at from vendors where status = 'approved' limit 1000
    `;
    return [
      ...staticPages,
      ...products.map((p) => ({
        url: `${base}/produits/${p.id}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...shops.map((s) => ({
        url: `${base}/boutique/${s.id}`,
        lastModified: new Date(s.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}

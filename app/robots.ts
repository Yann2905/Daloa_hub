import type { MetadataRoute } from "next";

function baseUrl() {
  const u = process.env.NEXT_PUBLIC_APP_URL;
  if (u && u.startsWith("http")) return u.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "https://daloa-hub.vercel.app";
}

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/vendeur", "/livreur", "/api", "/compte", "/messages", "/commande", "/panier", "/favoris"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

import "server-only";
import postgres from "postgres";

/**
 * Client PostgreSQL (Neon) partage.
 * En developpement, on reutilise l'instance via globalThis pour eviter
 * d'epuiser les connexions lors du hot-reload de Next.js.
 */
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

function createSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant. Voir .env.example");
  return postgres(url, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

export const sql = globalForDb.sql ?? createSql();

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

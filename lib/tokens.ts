import "server-only";
import { createHash, randomBytes } from "crypto";
import { sql } from "@/lib/db";

export type TokenPurpose = "verify" | "reset";

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cree un jeton a usage unique. Seul le HASH est stocke en base ;
 * le jeton en clair (retourne) part dans l'email.
 */
export async function createToken(
  userId: string,
  purpose: TokenPurpose,
  ttlMinutes: number,
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  // Un seul jeton actif par (user, purpose)
  await sql`delete from email_tokens where user_id = ${userId} and purpose = ${purpose}`;
  await sql`
    insert into email_tokens (token_hash, user_id, purpose, expires_at)
    values (${hash(raw)}, ${userId}, ${purpose}, now() + make_interval(mins => ${ttlMinutes}))
  `;
  return raw;
}

/**
 * Consomme un jeton (le supprime). Retourne l'user_id si valide et non expire.
 */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  if (!raw) return null;
  const rows = await sql<{ user_id: string }[]>`
    delete from email_tokens
    where token_hash = ${hash(raw)} and purpose = ${purpose} and expires_at > now()
    returning user_id
  `;
  return rows[0]?.user_id ?? null;
}

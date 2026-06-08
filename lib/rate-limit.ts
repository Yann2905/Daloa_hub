import "server-only";
import { sql } from "@/lib/db";

/**
 * Limitation anti-brute-force basee sur la base (fonctionne en serverless,
 * contrairement a une limite en memoire propre a chaque instance).
 */
const MAX_ATTEMPTS = 8;
const WINDOW_MIN = 15;

export async function isRateLimited(
  key: string,
): Promise<{ blocked: boolean; retryMin: number }> {
  try {
    const [r] = await sql<{ attempts: number; reset_at: string }[]>`
      select attempts, reset_at from login_attempts where key = ${key} limit 1
    `;
    if (r && new Date(r.reset_at) > new Date() && r.attempts >= MAX_ATTEMPTS) {
      const retryMin = Math.max(
        1,
        Math.ceil((new Date(r.reset_at).getTime() - Date.now()) / 60000),
      );
      return { blocked: true, retryMin };
    }
  } catch {
    /* en cas d'erreur DB, on ne bloque pas la connexion */
  }
  return { blocked: false, retryMin: 0 };
}

export async function recordFailedAttempt(key: string): Promise<void> {
  try {
    await sql`
      insert into login_attempts (key, attempts, reset_at)
      values (${key}, 1, now() + make_interval(mins => ${WINDOW_MIN}))
      on conflict (key) do update set
        attempts = case when login_attempts.reset_at < now() then 1
                        else login_attempts.attempts + 1 end,
        reset_at = case when login_attempts.reset_at < now()
                        then now() + make_interval(mins => ${WINDOW_MIN})
                        else login_attempts.reset_at end
    `;
  } catch {
    /* best-effort */
  }
}

export async function clearAttempts(key: string): Promise<void> {
  try {
    await sql`delete from login_attempts where key = ${key}`;
  } catch {
    /* best-effort */
  }
}

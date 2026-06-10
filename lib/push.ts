import "server-only";
import { sql } from "@/lib/db";
import { getUnreadMessageCount } from "@/lib/queries/chat";

/** Total non lu d'un utilisateur (notifications + messages) pour le badge d'icone. */
async function unreadBadge(userId: string): Promise<number> {
  try {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int as n from notifications where user_id = ${userId} and is_read = false
    `;
    const m = await getUnreadMessageCount(userId);
    return (n ?? 0) + m;
  } catch {
    return 0;
  }
}

/**
 * Notifications push via Firebase Cloud Messaging (FCM).
 * Necessite FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */
/** URL de base absolue de l'app (pour que le clic sur la notif ouvre la page). */
function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return "https://daloa-hub.vercel.app";
}

/** Rend une URL absolue (FCM exige un lien absolu pour le clic). */
function absoluteLink(url?: string): string {
  const u = url ?? "/";
  if (u.startsWith("http")) return u;
  return `${appBaseUrl()}${u.startsWith("/") ? u : `/${u}`}`;
}

export function isPushServerConfigured(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return true;
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

/** Normalise la cle privee (guillemets parasites, \n litteraux, espaces). */
function normalizePrivateKey(raw: string): string {
  let k = raw.trim();
  // Enleve d'eventuels guillemets entourants colles dans Vercel
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  // Convertit les \n litteraux en vrais sauts de ligne
  k = k.replace(/\\n/g, "\n");
  return k;
}

async function getMessaging() {
  if (!isPushServerConfigured()) return null;

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getMessaging } = await import("firebase-admin/messaging");

  // Option infaillible : le JSON complet du compte de service dans une variable.
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (typeof sa.private_key === "string") sa.private_key = normalizePrivateKey(sa.private_key);
    credential = cert(sa);
  } else {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID!.trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY!),
    });
  }

  const app = getApps().length ? getApps()[0] : initializeApp({ credential });
  return getMessaging(app);
}

export interface PushResult {
  configured: boolean;
  tokens: number;
  sent: number;
  failed: number;
  error?: string;
  who?: string;
}

/** Envoi avec rapport detaille (pour diagnostic). */
export async function pushUserResult(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<PushResult> {
  if (!isPushServerConfigured()) {
    return { configured: false, tokens: 0, sent: 0, failed: 0, error: "Firebase serveur non configure (FIREBASE_PRIVATE_KEY manquant)." };
  }
  try {
    const messaging = await getMessaging();
    if (!messaging) return { configured: false, tokens: 0, sent: 0, failed: 0, error: "Init Firebase impossible." };

    const rows = await sql<{ token: string }[]>`select token from fcm_tokens where user_id = ${userId}`;
    if (rows.length === 0) {
      return { configured: true, tokens: 0, sent: 0, failed: 0, error: "Aucun appareil enregistre (activez les notifications sur l'appareil)." };
    }
    const tokens = rows.map((r) => r.token);
    const link = absoluteLink(payload.url);
    const badge = await unreadBadge(userId);

    // Message "notification" : affiche automatiquement par FCM (le plus fiable
    // sur le web, pas de dependance a onBackgroundMessage). Le clic ouvre le lien.
    const resp = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: { url: link, badge: String(badge) },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon.svg",
          badge: "/icons/icon.svg",
        },
        fcmOptions: { link },
        headers: { Urgency: "high", TTL: "86400" },
      },
    });

    const invalid: string[] = [];
    let errMsg: string | undefined;
    resp.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        errMsg = code || r.error?.message;
        if (code.includes("registration-token-not-registered") || code.includes("invalid-argument") || code.includes("invalid-registration-token")) {
          invalid.push(tokens[i]);
        }
      }
    });
    if (invalid.length) await sql`delete from fcm_tokens where token = any(${invalid})`;

    return {
      configured: true,
      tokens: tokens.length,
      sent: resp.successCount,
      failed: resp.failureCount,
      error: resp.failureCount > 0 ? errMsg : undefined,
    };
  } catch (e) {
    return { configured: true, tokens: 0, sent: 0, failed: 0, error: e instanceof Error ? e.message : "Erreur." };
  }
}

/** Envoi direct a un token precis (pour le bouton de test). */
export async function pushToToken(
  token: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!isPushServerConfigured()) return { ok: false, error: "Firebase serveur non configure sur Vercel." };
  try {
    const messaging = await getMessaging();
    if (!messaging) return { ok: false, error: "Init Firebase impossible." };
    const link = absoluteLink(payload.url);
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: { url: link },
      webpush: {
        notification: { title: payload.title, body: payload.body, icon: "/icons/icon.svg", badge: "/icons/icon.svg" },
        fcmOptions: { link },
        headers: { Urgency: "high", TTL: "86400" },
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur d'envoi." };
  }
}

/** Envoi best-effort (ne casse jamais l'action metier). */
export async function pushUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  try {
    await pushUserResult(userId, payload);
  } catch {
    /* best-effort */
  }
}

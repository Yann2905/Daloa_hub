import "server-only";
import { sql } from "@/lib/db";

/**
 * Notifications push via Firebase Cloud Messaging (FCM).
 * Necessite FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */
export function isPushServerConfigured(): boolean {
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
  const projectId = process.env.FIREBASE_PROJECT_ID!.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY!);

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getMessaging } = await import("firebase-admin/messaging");
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
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
    const url = payload.url ?? "/";

    // Message "notification" : affiche automatiquement par FCM (le plus fiable
    // sur le web, pas de dependance a onBackgroundMessage). Le clic ouvre le lien.
    const resp = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: { url },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon.svg",
          badge: "/icons/icon.svg",
        },
        fcmOptions: { link: url },
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
    const url = payload.url ?? "/";
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: { url },
      webpush: {
        notification: { title: payload.title, body: payload.body, icon: "/icons/icon.svg", badge: "/icons/icon.svg" },
        fcmOptions: { link: url },
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

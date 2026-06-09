import "server-only";
import { sql } from "@/lib/db";

/**
 * Envoi de notifications push via Firebase Cloud Messaging (FCM), gratuit.
 * Necessite FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * (cle de compte de service). Best-effort : no-op si non configure.
 */
async function getMessaging() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n");

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getMessaging } = await import("firebase-admin/messaging");
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getMessaging(app);
}

export async function pushUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  try {
    const messaging = await getMessaging();
    if (!messaging) return;

    const rows = await sql<{ token: string }[]>`
      select token from fcm_tokens where user_id = ${userId}
    `;
    if (rows.length === 0) return;
    const tokens = rows.map((r) => r.token);
    const url = payload.url ?? "/";

    const resp = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: { url },
      webpush: { fcmOptions: { link: url } },
    });

    // Nettoie les tokens devenus invalides
    const invalid: string[] = [];
    resp.responses.forEach((r, i) => {
      const code = r.success ? null : r.error?.code;
      if (
        code &&
        (code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument") ||
          code.includes("invalid-registration-token"))
      ) {
        invalid.push(tokens[i]);
      }
    });
    if (invalid.length) {
      await sql`delete from fcm_tokens where token = any(${invalid})`;
    }
  } catch {
    /* best-effort */
  }
}

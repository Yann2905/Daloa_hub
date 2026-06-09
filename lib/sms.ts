import "server-only";
import { sql } from "@/lib/db";

/**
 * SMS transactionnels via l'API Brevo (meme compte que les emails).
 * Necessite BREVO_API_KEY + BREVO_SMS_SENDER (nom expediteur, max 11 car.)
 * et des credits SMS sur le compte Brevo.
 *
 * Best-effort : si non configure ou en echec, on ne casse jamais l'action.
 */
const BREVO_SMS_ENDPOINT = "https://api.brevo.com/v3/transactionalSMS/sms";

/** Convertit un numero local ivoirien en format international (sans +). */
export function toInternationalCI(phone: string): string | null {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("225")) return d; // deja international
  return "225" + d; // numero national CI (10 chiffres)
}

export async function sendSms(params: { to: string; text: string }): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SMS_SENDER;
  if (!apiKey || !sender) {
    console.warn("[sms] BREVO_API_KEY / BREVO_SMS_SENDER manquant, SMS ignore");
    return false;
  }
  const recipient = toInternationalCI(params.to);
  if (!recipient) return false;

  try {
    const res = await fetch(BREVO_SMS_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        type: "transactional",
        unicodeEnabled: false,
        sender,
        recipient,
        content: params.text.slice(0, 320),
      }),
    });
    if (!res.ok) {
      console.error("[sms] Brevo a refuse :", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[sms] erreur reseau :", e);
    return false;
  }
}

/** Envoie un SMS a un utilisateur a partir de son id (recherche du telephone). */
export async function smsUser(userId: string, text: string): Promise<void> {
  try {
    const [u] = await sql<{ phone: string | null }[]>`
      select phone from users where id = ${userId} limit 1
    `;
    if (u?.phone) await sendSms({ to: u.phone, text });
  } catch (e) {
    console.error("[sms] smsUser :", e);
  }
}

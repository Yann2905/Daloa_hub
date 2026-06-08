import "server-only";
import { sql } from "@/lib/db";

/**
 * Envoi d'emails transactionnels via l'API Brevo (ex-Sendinblue).
 * Gratuit jusqu'a 300 emails/jour. Necessite BREVO_API_KEY et un expediteur
 * verifie dans Brevo (EMAIL_FROM).
 *
 * Tout est best-effort : un echec d'email ne casse jamais l'action metier.
 */
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function sendEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    // Email non configure : on n'echoue pas, on journalise simplement.
    console.warn("[email] BREVO_API_KEY manquant, email ignore :", params.subject);
    return false;
  }

  const sender = {
    name: process.env.EMAIL_FROM_NAME ?? "DALOA HUB",
    email: process.env.EMAIL_FROM ?? "no-reply@daloahub.ci",
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: params.to, name: params.toName }],
        subject: params.subject,
        htmlContent: wrapHtml(params.subject, params.html),
      }),
    });
    if (!res.ok) {
      console.error("[email] Brevo a refuse :", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] erreur reseau :", e);
    return false;
  }
}

/** Envoie un email a un utilisateur a partir de son id (recherche email). */
export async function emailUser(
  userId: string,
  subject: string,
  bodyHtml: string,
): Promise<void> {
  try {
    const [u] = await sql<{ email: string | null; full_name: string }[]>`
      select email, full_name from users where id = ${userId} limit 1
    `;
    if (u?.email) {
      await sendEmail({ to: u.email, toName: u.full_name, subject, html: bodyHtml });
    }
  } catch (e) {
    console.error("[email] emailUser :", e);
  }
}

/** Gabarit HTML simple aux couleurs DALOA HUB. */
function wrapHtml(title: string, content: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;color:#0B3C26">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0B3C26;border-radius:12px 12px 0 0;padding:20px 24px">
      <span style="color:#fff;font-size:18px;font-weight:bold">DALOA <span style="color:#00A651">HUB</span></span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${content}
    </div>
    <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px">
      DALOA HUB - Marketplace de la ville de Daloa
    </p>
  </div></body></html>`;
}

export function orderEmailButton(orderId: string, label: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://daloa-hub.vercel.app";
  return `<p style="margin:20px 0"><a href="${base}/commandes/${orderId}"
    style="background:#00A651;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:bold">${label}</a></p>`;
}

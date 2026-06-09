"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { dashboardPath, getUser } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { createToken, consumeToken } from "@/lib/tokens";
import { sendEmail, emailButton, appBaseUrl } from "@/lib/email";
import type { UserRole } from "@/lib/database.types";

async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = await createToken(userId, "verify", 60 * 24);
  const url = `${appBaseUrl()}/verifier-email?token=${token}`;
  await sendEmail({
    to: email,
    toName: name,
    subject: "Confirmez votre adresse e-mail",
    html: `<p>Bonjour ${name},</p><p>Bienvenue sur DALOA HUB ! Confirmez votre adresse e-mail pour securiser votre compte.</p>${emailButton(url, "Confirmer mon e-mail")}<p style="color:#64748b;font-size:13px">Ce lien expire dans 24 heures.</p>`,
  });
}

export interface ActionResult {
  error?: string;
  sent?: boolean;
}

const signInSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const rlKey = parsed.data.email.toLowerCase();
  const rl = await isRateLimited(rlKey);
  if (rl.blocked) {
    return { error: `Trop de tentatives. Reessayez dans ${rl.retryMin} min.` };
  }

  try {
    await authSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      await recordFailedAttempt(rlKey);
      return { error: "Identifiants incorrects." };
    }
    throw e;
  }

  await clearAttempts(rlKey);

  const rows = await sql<{ role: UserRole; account_status: string }[]>`
    select role, account_status from users
    where email = ${parsed.data.email.toLowerCase()} limit 1
  `;
  if (rows[0]?.account_status === "suspended") redirect("/suspendu");

  const redirectTo = (formData.get("redirect") as string) || null;
  redirect(redirectTo || dashboardPath(rows[0]?.role ?? "client"));
}

const signUpSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Telephone requis"),
  password: z.string().min(6, "6 caracteres minimum"),
  role: z.enum(["client", "vendor", "driver"]),
  shop_name: z.string().optional(),
});

export async function signUp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
    shop_name: formData.get("shop_name") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email, password, full_name, phone, role, shop_name } = parsed.data;
  const lowerEmail = email.toLowerCase();

  // Email deja utilise ?
  const existing = await sql`select 1 from users where email = ${lowerEmail} limit 1`;
  if (existing.length > 0) return { error: "Cet e-mail est deja utilise." };

  const passwordHash = await hashPassword(password);

  // Creation transactionnelle : user + profil metier
  let newUserId: string;
  try {
    newUserId = await sql.begin(async (tx) => {
      const [user] = await tx<{ id: string }[]>`
        insert into users (email, password_hash, role, full_name, phone)
        values (${lowerEmail}, ${passwordHash}, ${role}, ${full_name}, ${phone})
        returning id
      `;
      if (role === "vendor") {
        await tx`
          insert into vendors (user_id, shop_name)
          values (${user.id}, ${shop_name ?? "Ma boutique"})
        `;
      } else if (role === "driver") {
        await tx`insert into drivers (user_id) values (${user.id})`;
      }
      return user.id;
    });
  } catch {
    return { error: "Impossible de creer le compte. Reessayez." };
  }

  // Email de verification (best-effort, ne bloque pas l'inscription)
  await sendVerificationEmail(newUserId, lowerEmail, full_name);

  // Connexion automatique
  try {
    await authSignIn("credentials", { email: lowerEmail, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Compte cree. Connectez-vous." };
    throw e;
  }

  redirect(dashboardPath(role));
}

/** Renvoyer l'email de verification (utilisateur connecte). */
export async function resendVerification(): Promise<ActionResult> {
  const user = await getUser();
  if (!user?.id) return { error: "Non autorise." };
  const [u] = await sql<{ email: string | null; full_name: string; email_verified: boolean }[]>`
    select email, full_name, email_verified from users where id = ${user.id} limit 1
  `;
  if (!u?.email) return { error: "Email introuvable." };
  if (u.email_verified) return { sent: true };
  await sendVerificationEmail(user.id, u.email, u.full_name);
  return { sent: true };
}

/** Verifie l'email a partir du jeton (appelee par la page /verifier-email). */
export async function verifyEmailToken(token: string): Promise<boolean> {
  const userId = await consumeToken(token, "verify");
  if (!userId) return false;
  await sql`update users set email_verified = true where id = ${userId}`;
  return true;
}

const emailOnly = z.object({ email: z.string().email("Adresse e-mail invalide") });

/** Demande de reinitialisation : email envoye si le compte existe (anti-enumeration). */
export async function requestPasswordReset(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailOnly.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const email = parsed.data.email.toLowerCase();

  const [u] = await sql<{ id: string; full_name: string }[]>`
    select id, full_name from users where email = ${email} limit 1
  `;
  if (u) {
    const token = await createToken(u.id, "reset", 60);
    const url = `${appBaseUrl()}/reinitialiser?token=${token}`;
    await sendEmail({
      to: email,
      toName: u.full_name,
      subject: "Reinitialisation de votre mot de passe",
      html: `<p>Bonjour ${u.full_name},</p><p>Vous avez demande a reinitialiser votre mot de passe.</p>${emailButton(url, "Choisir un nouveau mot de passe")}<p style="color:#64748b;font-size:13px">Ce lien expire dans 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>`,
    });
  }
  return { sent: true }; // toujours succes : on ne revele pas l'existence du compte
}

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6, "6 caracteres minimum"),
});

export async function resetPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const userId = await consumeToken(parsed.data.token, "reset");
  if (!userId) return { error: "Lien invalide ou expire. Refaites une demande." };

  const hash = await hashPassword(parsed.data.password);
  await sql`update users set password_hash = ${hash} where id = ${userId}`;
  redirect("/login?reset=1");
}

export async function signOut() {
  await authSignOut({ redirectTo: "/login" });
}

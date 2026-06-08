"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { dashboardPath } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import type { UserRole } from "@/lib/database.types";

export interface ActionResult {
  error?: string;
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
  try {
    await sql.begin(async (tx) => {
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
    });
  } catch {
    return { error: "Impossible de creer le compte. Reessayez." };
  }

  // Connexion automatique
  try {
    await authSignIn("credentials", { email: lowerEmail, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Compte cree. Connectez-vous." };
    throw e;
  }

  redirect(dashboardPath(role));
}

export async function signOut() {
  await authSignOut({ redirectTo: "/login" });
}

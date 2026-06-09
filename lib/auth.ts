import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import type { Profile, UserRole } from "@/lib/database.types";

/** Session utilisateur courante (ou null). */
export async function getSession() {
  return auth();
}

/** Identifiant + role de l'utilisateur connecte (ou null). */
export async function getUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Profil complet (table users) de l'utilisateur courant (ou null). */
export async function getProfile(): Promise<Profile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const rows = await sql<Profile[]>`
    select id, role, full_name, email, phone, avatar_url, address,
           lat, lng, account_status, email_verified, created_at, updated_at
    from users where id = ${session.user.id} limit 1
  `;
  return rows[0] ?? null;
}

/** Exige une session ; redirige vers /login sinon. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige un role autorise ; sinon /login, /403 ou /suspendu. */
export async function requireRole(
  roles: UserRole | UserRole[],
): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.account_status === "suspended") redirect("/suspendu");

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(profile.role)) redirect("/403");
  return profile;
}

/** Tableau de bord par defaut selon le role. */
export function dashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "vendor":
      return "/vendeur";
    case "driver":
      return "/livreur";
    default:
      return "/";
  }
}

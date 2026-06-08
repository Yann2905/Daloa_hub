import type { NextAuthConfig } from "next-auth";
import type { UserRole, AccountStatus } from "@/lib/database.types";

/**
 * Configuration de base Auth.js, SANS acces base de donnees.
 * Edge-safe : utilisable dans le middleware. Le provider Credentials
 * (qui touche la base) est ajoute dans auth.ts (runtime Node).
 */

// Prefixes proteges -> roles autorises (vide = tout utilisateur connecte)
const ROLE_GUARDS: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/vendeur", roles: ["vendor"] },
  { prefix: "/livreur", roles: ["driver"] },
  { prefix: "/compte", roles: [] },
  { prefix: "/commandes", roles: [] },
];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // ajoutes dans auth.ts
  callbacks: {
    // Protection des routes (executee dans le middleware)
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const guard = ROLE_GUARDS.find((g) => pathname.startsWith(g.prefix));
      if (!guard) return true; // route publique
      if (!auth?.user) return false; // -> redirige vers /login
      if (guard.roles.length > 0 && !guard.roles.includes(role ?? "")) {
        // Connecte mais mauvais role : refuse l'acces
        return Response.redirect(new URL("/403", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
        token.accountStatus = (user as { accountStatus: AccountStatus }).accountStatus;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.accountStatus = token.accountStatus as AccountStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { UserRole, AccountStatus } from "@/lib/database.types";

// Sur Vercel, force l'URL de base reelle du deploiement (ecrase un eventuel
// AUTH_URL=localhost mal configure dans le tableau de bord). Auth.js lit ces
// variables a l'initialisation ci-dessous, donc on les positionne avant.
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (vercelHost) {
  process.env.AUTH_URL = `https://${vercelHost}`;
  process.env.NEXTAUTH_URL = `https://${vercelHost}`;
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const rows = await sql<UserRow[]>`
          select id, email, password_hash, full_name, role, account_status
          from users where email = ${email.toLowerCase()} limit 1
        `;
        const user = rows[0];
        if (!user) return null;

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          accountStatus: user.account_status,
        };
      },
    }),
  ],
});

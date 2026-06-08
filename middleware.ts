import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware Auth.js : la protection des routes est geree par le callback
 * `authorized` de auth.config.ts (edge-safe, sans acces base de donnees).
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

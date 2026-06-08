import "server-only";
import bcrypt from "bcryptjs";

/** Hash un mot de passe (bcrypt, cout 10). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Verifie un mot de passe contre son hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

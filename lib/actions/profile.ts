"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

/** Met a jour la photo de profil de l'utilisateur connecte. */
export async function updateAvatar(url: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorise." };
  if (!z.string().url().safeParse(url).success) return { error: "Image invalide." };

  await sql`update users set avatar_url = ${url} where id = ${user.id}`;
  revalidatePath("/compte");
  revalidatePath("/livreur");
  revalidatePath("/livreur/documents");
  return {};
}

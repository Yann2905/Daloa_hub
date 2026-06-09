"use server";

import { z } from "zod";
import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pushToToken } from "@/lib/push";

/**
 * Envoie une notification de test DIRECTEMENT au token de l'appareil courant.
 * Enregistre aussi le token (au cas ou) pour les vraies notifications.
 */
export async function sendTestPushToToken(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Non connecte." };
  if (!z.string().min(20).safeParse(token).success) return { ok: false, error: "Token invalide." };

  // (Re)associe le token a ce compte pour que les vraies notifs marchent aussi.
  await sql`
    insert into fcm_tokens (token, user_id) values (${token}, ${user.id})
    on conflict (token) do update set user_id = excluded.user_id, created_at = now()
  `;

  return pushToToken(token, {
    title: "Test DALOA HUB",
    body: "Vos notifications fonctionnent !",
    url: "/",
  });
}

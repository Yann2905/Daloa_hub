"use server";

import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pushUserResult, type PushResult } from "@/lib/push";

/** Envoie une notification de test a l'utilisateur courant et retourne le diagnostic. */
export async function sendTestPush(): Promise<PushResult> {
  const user = await getUser();
  if (!user) return { configured: false, tokens: 0, sent: 0, failed: 0, error: "Non connecte." };

  const [u] = await sql<{ email: string }[]>`select email from users where id = ${user.id}`;
  const r = await pushUserResult(user.id, {
    title: "Test DALOA HUB",
    body: "Si vous voyez ceci, les notifications fonctionnent !",
    url: "/",
  });
  return { ...r, who: u?.email ?? user.id };
}

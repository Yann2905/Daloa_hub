"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getParticipation } from "@/lib/queries/chat";
import { pushUser } from "@/lib/push";

/**
 * Ouvre (ou cree) la conversation entre le client courant et un vendeur.
 * Optionnellement, envoie un premier message lie a un produit (negociation).
 * Retourne l'id de la conversation.
 */
export async function openConversation(input: {
  vendorId: string;
  productId?: string;
  starter?: string;
}): Promise<{ id?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Connectez-vous pour contacter le vendeur." };

  const vendorId = z.string().uuid().safeParse(input.vendorId);
  if (!vendorId.success) return { error: "Vendeur invalide." };

  // Le vendeur ne se contacte pas lui-meme
  const [v] = await sql<{ user_id: string }[]>`
    select user_id from vendors where id = ${input.vendorId} limit 1
  `;
  if (!v) return { error: "Boutique introuvable." };
  if (v.user_id === user.id) return { error: "Vous etes le vendeur de cette boutique." };

  const existing = await sql<{ id: string }[]>`
    select id from conversations where client_id = ${user.id} and vendor_id = ${input.vendorId} limit 1
  `;
  if (existing[0]) return { id: existing[0].id };

  const [conv] = await sql<{ id: string }[]>`
    insert into conversations (client_id, vendor_id)
    values (${user.id}, ${input.vendorId}) returning id
  `;

  if (input.starter?.trim()) {
    await sql`
      insert into messages (conversation_id, sender_id, body, product_id)
      values (${conv.id}, ${user.id}, ${input.starter.trim()}, ${input.productId ?? null})
    `;
    await sql`update conversations set last_message_at = now() where id = ${conv.id}`;
    await sql`select notify_user(${v.user_id}, 'new_message', 'Nouveau message',
      'Un client souhaite discuter avec vous.', ${sql.json({ conversation_id: conv.id })})`;
    await pushUser(v.user_id, {
      title: "Nouveau message",
      body: "Un client souhaite discuter avec vous.",
      url: `/messages/${conv.id}`,
    });
  }

  return { id: conv.id };
}

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(1000),
});

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<{ error?: string }> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: "Message invalide." };

  const part = await getParticipation(parsed.data.conversationId);
  if (!part) return { error: "Conversation introuvable." };

  await sql`
    insert into messages (conversation_id, sender_id, body)
    values (${parsed.data.conversationId}, ${part.userId}, ${parsed.data.body.trim()})
  `;
  await sql`update conversations set last_message_at = now() where id = ${parsed.data.conversationId}`;

  // Notifie l'autre partie
  const recipient = part.isClient ? part.vendor_user : part.client_id;
  await sql`select notify_user(${recipient}, 'new_message', 'Nouveau message',
    'Vous avez recu un nouveau message.', ${sql.json({ conversation_id: parsed.data.conversationId })})`;
  await pushUser(recipient, {
    title: "Nouveau message",
    body: parsed.data.body.trim().slice(0, 90),
    url: `/messages/${parsed.data.conversationId}`,
  });

  revalidatePath(`/messages/${parsed.data.conversationId}`);
  return {};
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const part = await getParticipation(conversationId);
  if (!part) return;
  await sql`
    update messages set read_at = now()
    where conversation_id = ${conversationId} and sender_id <> ${part.userId} and read_at is null
  `;
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getParticipation } from "@/lib/queries/chat";
import { pushUser } from "@/lib/push";
import { generateSupportReply } from "@/lib/support-ai";

const TEAM = "Equipe de DALOA HUB";

/** Reponse automatique de l'agent IA dans un fil de support. */
async function replySupportAI(convId: string, clientId: string): Promise<void> {
  try {
    const rows = await sql<{ body: string; from_team: boolean }[]>`
      select body, from_team from messages
      where conversation_id = ${convId} and deleted_at is null
      order by created_at asc limit 20
    `;
    const history = rows.map((r) => ({
      role: (r.from_team ? "assistant" : "user") as "assistant" | "user",
      content: r.body,
    }));
    const { reply, escalate } = await generateSupportReply(history);

    await sql`insert into messages (conversation_id, sender_id, body, from_team, is_ai)
      values (${convId}, null, ${reply}, true, true)`;
    await sql`update conversations set last_message_at = now(), needs_human = ${escalate} where id = ${convId}`;
    await sql`select notify_user(${clientId}, 'new_message', ${TEAM},
      ${reply.slice(0, 120)}, ${sql.json({ conversation_id: convId })})`;
    await pushUser(clientId, { title: TEAM, body: reply.slice(0, 90), url: `/messages/${convId}` });

    if (escalate) {
      const admins = await sql<{ id: string }[]>`select id from users where role = 'admin'`;
      for (const a of admins) {
        await sql`select notify_user(${a.id}, 'report_received', 'Support a traiter',
          'Un utilisateur a besoin d''aide humaine.', ${sql.json({ conversation_id: convId })})`;
      }
    }
  } catch {
    /* best-effort */
  }
}

/** Ouvre (ou cree) le fil ASSISTANT IA (service client) de l'utilisateur. */
export async function getOrCreateSupportThread(): Promise<{ id?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Connectez-vous pour contacter le service client." };
  const [existing] = await sql<{ id: string }[]>`
    select id from conversations where client_id = ${user.id} and is_support and support_kind = 'ai' limit 1
  `;
  if (existing) return { id: existing.id };
  const [conv] = await sql<{ id: string }[]>`
    insert into conversations (client_id, is_support, support_kind)
    values (${user.id}, true, 'ai') returning id
  `;
  await sql`insert into messages (conversation_id, sender_id, body, from_team, is_ai)
    values (${conv.id}, null, ${"Bonjour ! Je suis l'assistant DALOA HUB. Posez-moi votre question, je suis la pour vous aider."}, true, true)`;
  await sql`update conversations set last_message_at = now() where id = ${conv.id}`;
  return { id: conv.id };
}

/** Recupere (ou cree) le fil EQUIPE (humains) d'un utilisateur. */
async function getOrCreateTeamThread(userId: string): Promise<string> {
  const [existing] = await sql<{ id: string }[]>`
    select id from conversations where client_id = ${userId} and is_support and support_kind = 'team' limit 1
  `;
  if (existing) return existing.id;
  const [conv] = await sql<{ id: string }[]>`
    insert into conversations (client_id, is_support, support_kind)
    values (${userId}, true, 'team') returning id
  `;
  return conv.id;
}

/** Admin : envoie un message a UN utilisateur (depuis l'Equipe). Retourne le fil. */
export async function adminMessageUser(
  userId: string,
  body: string,
): Promise<{ id?: string; error?: string }> {
  const me = await getUser();
  if (!me || me.role !== "admin") return { error: "Acces refuse." };
  const text = body.trim();
  if (!text) return { error: "Message vide." };
  const convId = await getOrCreateTeamThread(userId);
  await sql`insert into messages (conversation_id, sender_id, body, from_team)
    values (${convId}, ${me.id}, ${text}, true)`;
  await sql`update conversations set last_message_at = now() where id = ${convId}`;
  await sql`select notify_user(${userId}, 'new_message', ${TEAM}, ${text.slice(0, 120)},
    ${sql.json({ conversation_id: convId })})`;
  await pushUser(userId, { title: TEAM, body: text.slice(0, 90), url: `/messages/${convId}` });
  return { id: convId };
}

/** Admin : diffuse une annonce a TOUS les utilisateurs (via leur fil de support). */
export async function broadcastToUsers(body: string): Promise<{ sent?: number; error?: string }> {
  const me = await getUser();
  if (!me || me.role !== "admin") return { error: "Acces refuse." };
  const text = body.trim();
  if (!text) return { error: "Message vide." };
  const users = await sql<{ id: string }[]>`select id from users where role <> 'admin'`;
  for (const u of users) {
    const convId = await getOrCreateTeamThread(u.id);
    await sql`insert into messages (conversation_id, sender_id, body, from_team)
      values (${convId}, ${me.id}, ${text}, true)`;
    await sql`update conversations set last_message_at = now() where id = ${convId}`;
    await sql`select notify_user(${u.id}, 'new_message', ${TEAM}, ${text.slice(0, 120)},
      ${sql.json({ conversation_id: convId })})`;
    await pushUser(u.id, { title: TEAM, body: text.slice(0, 90), url: `/messages/${convId}` });
  }
  return { sent: users.length };
}

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

  const convId = parsed.data.conversationId;
  const text = parsed.data.body.trim();
  // Un admin qui ecrit dans un fil de support parle au nom de l'equipe.
  const fromTeam = part.isSupport && part.isAdmin;

  await sql`
    insert into messages (conversation_id, sender_id, body, from_team)
    values (${convId}, ${part.userId}, ${text}, ${fromTeam})
  `;
  await sql`update conversations set last_message_at = now() where id = ${convId}`;

  if (part.isSupport) {
    const teamLabel = part.supportKind === "ai" ? "Assistant DALOA HUB" : "Equipe de DALOA HUB";
    if (fromTeam) {
      // Equipe/assistant -> client
      await sql`select notify_user(${part.client_id}, 'new_message', ${teamLabel},
        ${text.slice(0, 120)}, ${sql.json({ conversation_id: convId })})`;
      await pushUser(part.client_id, {
        title: teamLabel,
        body: text.slice(0, 90),
        url: `/messages/${convId}`,
      });
    } else if (part.supportKind === "ai") {
      // Fil ASSISTANT : reponse automatique de l'agent IA
      await replySupportAI(convId, part.client_id);
    } else {
      // Fil EQUIPE (humains) : on previent les admins, pas d'IA
      const admins = await sql<{ id: string }[]>`select id from users where role = 'admin'`;
      for (const a of admins) {
        await sql`select notify_user(${a.id}, 'new_message', 'Reponse a un message equipe',
          ${text.slice(0, 120)}, ${sql.json({ conversation_id: convId })})`;
      }
    }
  } else {
    const recipient = part.isClient ? part.vendor_user : part.client_id;
    if (recipient) {
      await sql`select notify_user(${recipient}, 'new_message', 'Nouveau message',
        'Vous avez recu un nouveau message.', ${sql.json({ conversation_id: convId })})`;
      await pushUser(recipient, {
        title: "Nouveau message",
        body: text.slice(0, 90),
        url: `/messages/${convId}`,
      });
    }
  }

  revalidatePath(`/messages/${convId}`);
  return {};
}

/** Supprime un message (seulement le sien). Suppression douce ("Message supprime"). */
export async function deleteMessage(messageId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorise." };
  const [m] = await sql<{ sender_id: string; conversation_id: string }[]>`
    select sender_id, conversation_id from messages where id = ${messageId} limit 1
  `;
  if (!m) return { error: "Message introuvable." };
  if (m.sender_id !== user.id) return { error: "Vous ne pouvez supprimer que vos messages." };
  await sql`update messages set deleted_at = now() where id = ${messageId}`;
  revalidatePath(`/messages/${m.conversation_id}`);
  return {};
}

/** Supprime une conversation pour l'utilisateur courant (elle reapparait s'il
 * recoit un nouveau message). */
export async function deleteConversation(conversationId: string): Promise<{ error?: string }> {
  const part = await getParticipation(conversationId);
  if (!part) return { error: "Conversation introuvable." };
  if (part.isClient) {
    await sql`update conversations set client_hidden_at = now() where id = ${conversationId}`;
  } else if (part.isVendor) {
    await sql`update conversations set vendor_hidden_at = now() where id = ${conversationId}`;
  } else {
    return { error: "Action non autorisee." };
  }
  revalidatePath("/messages");
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

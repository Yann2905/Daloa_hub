import "server-only";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export interface ConversationRow {
  id: string;
  last_message_at: string;
  other_name: string; // nom de l'autre partie (selon le role)
  other_avatar: string | null;
  last_body: string | null;
  unread: number;
}

/**
 * Verifie que l'utilisateur courant est participant a la conversation.
 * Retourne { role, clientId, vendorUserId } ou null.
 */
export async function getParticipation(conversationId: string) {
  const user = await getUser();
  if (!user) return null;
  const [c] = await sql<
    { client_id: string; vendor_user: string; vendor_id: string }[]
  >`
    select c.client_id, c.vendor_id, v.user_id as vendor_user
    from conversations c join vendors v on v.id = c.vendor_id
    where c.id = ${conversationId} limit 1
  `;
  if (!c) return null;
  const isClient = c.client_id === user.id;
  const isVendor = c.vendor_user === user.id;
  if (!isClient && !isVendor && user.role !== "admin") return null;
  return { userId: user.id, isClient, isVendor, ...c };
}

/** Conversations de l'utilisateur courant (client ou vendeur). */
export async function listMyConversations(): Promise<ConversationRow[]> {
  const user = await getUser();
  if (!user) return [];
  try {
    return await sql<ConversationRow[]>`
      select c.id, c.last_message_at,
        case when c.client_id = ${user.id} then vu.full_name else cu.full_name end as other_name,
        case when c.client_id = ${user.id} then vu.avatar_url else cu.avatar_url end as other_avatar,
        (select m.body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body,
        (select count(*)::int from messages m where m.conversation_id = c.id
           and m.sender_id <> ${user.id} and m.read_at is null) as unread
      from conversations c
      join users cu on cu.id = c.client_id
      join vendors v on v.id = c.vendor_id
      join users vu on vu.id = v.user_id
      where c.client_id = ${user.id} or v.user_id = ${user.id}
      order by c.last_message_at desc
    `;
  } catch {
    return [];
  }
}

export interface MessageRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  return await sql<MessageRow[]>`
    select id, sender_id, body, created_at, read_at
    from messages where conversation_id = ${conversationId}
    order by created_at asc limit 200
  `;
}

/** Met a jour la presence (derniere activite) de l'utilisateur. */
export async function touchPresence(userId: string): Promise<void> {
  try {
    await sql`update users set last_active_at = now() where id = ${userId}`;
  } catch {
    /* best-effort */
  }
}

/** Vrai si l'utilisateur a ete actif il y a moins de 90 secondes. */
export async function isUserOnline(userId: string): Promise<boolean> {
  const [r] = await sql<{ online: boolean }[]>`
    select (last_active_at > now() - interval '90 seconds') as online
    from users where id = ${userId}
  `;
  return r?.online ?? false;
}

/** En-tete de conversation : nom + avatar de l'autre partie, et la boutique. */
export async function getConversationHeader(conversationId: string) {
  const user = await getUser();
  if (!user) return null;
  const [row] = await sql<
    { other_name: string; other_avatar: string | null; shop_name: string; vendor_id: string }[]
  >`
    select case when c.client_id = ${user.id} then vu.full_name else cu.full_name end as other_name,
           case when c.client_id = ${user.id} then vu.avatar_url else cu.avatar_url end as other_avatar,
           v.shop_name, v.id as vendor_id
    from conversations c
    join users cu on cu.id = c.client_id
    join vendors v on v.id = c.vendor_id
    join users vu on vu.id = v.user_id
    where c.id = ${conversationId} limit 1
  `;
  return row ?? null;
}

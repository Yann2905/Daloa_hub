import "server-only";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const TEAM_NAME = "Equipe de DALOA HUB";

export interface ConversationRow {
  id: string;
  last_message_at: string;
  other_name: string; // nom de l'autre partie (selon le role)
  other_avatar: string | null;
  last_body: string | null;
  unread: number;
  is_support: boolean;
}

/**
 * Verifie que l'utilisateur courant est participant a la conversation.
 * Gere les conversations vendeur ET le support (Equipe de DALOA HUB).
 */
export async function getParticipation(conversationId: string) {
  const user = await getUser();
  if (!user) return null;
  const [c] = await sql<
    { client_id: string; vendor_user: string | null; vendor_id: string | null; is_support: boolean }[]
  >`
    select c.client_id, c.vendor_id, c.is_support, v.user_id as vendor_user
    from conversations c left join vendors v on v.id = c.vendor_id
    where c.id = ${conversationId} limit 1
  `;
  if (!c) return null;
  const isClient = c.client_id === user.id;
  const isVendor = c.vendor_user != null && c.vendor_user === user.id;
  const isAdmin = user.role === "admin";
  // Support : seul le client concerne ou un admin (l'equipe).
  if (c.is_support) {
    if (!isClient && !isAdmin) return null;
  } else if (!isClient && !isVendor && !isAdmin) {
    return null;
  }
  return {
    userId: user.id,
    isClient,
    isVendor,
    isAdmin,
    isSupport: c.is_support,
    client_id: c.client_id,
    vendor_id: c.vendor_id,
    vendor_user: c.vendor_user,
  };
}

/** Conversations de l'utilisateur courant (vendeur ET support). */
export async function listMyConversations(): Promise<ConversationRow[]> {
  const user = await getUser();
  if (!user) return [];
  try {
    return await sql<ConversationRow[]>`
      select c.id, c.last_message_at, c.is_support,
        case when c.is_support then ${TEAM_NAME}
             when c.client_id = ${user.id} then vu.full_name
             else cu.full_name end as other_name,
        case when c.is_support then null
             when c.client_id = ${user.id} then vu.avatar_url
             else cu.avatar_url end as other_avatar,
        (select case when m.deleted_at is not null then 'Message supprime' else m.body end
           from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body,
        (select count(*)::int from messages m where m.conversation_id = c.id
           and m.read_at is null and m.deleted_at is null
           and (case when c.is_support then m.from_team else m.sender_id <> ${user.id} end)) as unread
      from conversations c
      join users cu on cu.id = c.client_id
      left join vendors v on v.id = c.vendor_id
      left join users vu on vu.id = v.user_id
      where (c.client_id = ${user.id} or v.user_id = ${user.id})
        and case
          when c.client_id = ${user.id} then coalesce(c.client_hidden_at, 'epoch') < c.last_message_at
          when v.user_id = ${user.id} then coalesce(c.vendor_hidden_at, 'epoch') < c.last_message_at
          else true end
      order by c.last_message_at desc
    `;
  } catch {
    return [];
  }
}

export interface MessageRow {
  id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  read_at: string | null;
  deleted: boolean;
  from_team: boolean;
  is_ai: boolean;
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  return await sql<MessageRow[]>`
    select id, sender_id,
           case when deleted_at is not null then null else body end as body,
           created_at, read_at, (deleted_at is not null) as deleted,
           from_team, is_ai
    from messages where conversation_id = ${conversationId}
    order by created_at asc limit 200
  `;
}

/** Nombre total de messages non lus pour l'utilisateur courant. */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const [r] = await sql<{ n: number }[]>`
      select count(*)::int as n
      from messages m
      join conversations c on c.id = m.conversation_id
      left join vendors v on v.id = c.vendor_id
      where m.read_at is null and m.deleted_at is null
        and (
          (c.is_support and c.client_id = ${userId} and m.from_team)
          or (not c.is_support and m.sender_id <> ${userId}
              and (c.client_id = ${userId} or v.user_id = ${userId}))
        )
    `;
    return r?.n ?? 0;
  } catch {
    return 0;
  }
}

export interface SupportThreadRow {
  id: string;
  needs_human: boolean;
  last_message_at: string;
  client_name: string;
  email: string;
  last_body: string | null;
  unread: number;
}

/** Tous les fils de service client (admin). Les "a traiter" en premier. */
export async function listSupportThreads(): Promise<SupportThreadRow[]> {
  return await sql<SupportThreadRow[]>`
    select c.id, c.needs_human, c.last_message_at, cu.full_name as client_name, cu.email,
      (select case when m.deleted_at is not null then 'Message supprime' else m.body end
        from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body,
      (select count(*)::int from messages m where m.conversation_id = c.id
        and not m.from_team and m.read_at is null and m.deleted_at is null) as unread
    from conversations c join users cu on cu.id = c.client_id
    where c.is_support
    order by c.needs_human desc, c.last_message_at desc
    limit 200
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
    {
      other_name: string;
      other_avatar: string | null;
      shop_name: string | null;
      vendor_id: string | null;
      is_support: boolean;
      is_client: boolean;
    }[]
  >`
    select c.is_support, (c.client_id = ${user.id}) as is_client,
           case when c.is_support and c.client_id = ${user.id} then ${TEAM_NAME}
                when c.client_id = ${user.id} then vu.full_name
                else cu.full_name end as other_name,
           case when c.is_support then null
                when c.client_id = ${user.id} then vu.avatar_url
                else cu.avatar_url end as other_avatar,
           v.shop_name, v.id as vendor_id
    from conversations c
    join users cu on cu.id = c.client_id
    left join vendors v on v.id = c.vendor_id
    left join users vu on vu.id = v.user_id
    where c.id = ${conversationId} limit 1
  `;
  return row ?? null;
}

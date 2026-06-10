import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getUnreadMessageCount } from "@/lib/queries/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liste les notifications de l'utilisateur connecte (polling). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [], unread: 0, total: 0 }, { status: 401 });

  // Presence (pour le statut "en ligne" du chat)
  await sql`update users set last_active_at = now() where id = ${user.id}`;

  const items = await sql`
    select id, user_id, type, title, body, data, is_read, created_at
    from notifications where user_id = ${user.id}
    order by created_at desc limit 20
  `;
  const [{ n: unread }] = await sql<{ n: number }[]>`
    select count(*)::int as n from notifications where user_id = ${user.id} and is_read = false
  `;
  const messages = await getUnreadMessageCount(user.id);
  // total = notifications + messages non lus (pour le badge de l'icone PWA)
  return NextResponse.json({ items, unread, total: unread + messages });
}

/** Marque toutes les notifications comme lues. */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await sql`update notifications set is_read = true
            where user_id = ${user.id} and is_read = false`;
  return NextResponse.json({ ok: true });
}

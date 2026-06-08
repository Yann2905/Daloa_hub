import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liste les notifications de l'utilisateur connecte (polling). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const items = await sql`
    select id, user_id, type, title, body, data, is_read, created_at
    from notifications where user_id = ${user.id}
    order by created_at desc limit 20
  `;
  return NextResponse.json({ items });
}

/** Marque toutes les notifications comme lues. */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await sql`update notifications set is_read = true
            where user_id = ${user.id} and is_read = false`;
  return NextResponse.json({ ok: true });
}

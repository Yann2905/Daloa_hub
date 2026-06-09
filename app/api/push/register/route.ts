import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Enregistre (ou reassocie) un token FCM pour l'utilisateur connecte. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let token: string | undefined;
  try {
    token = (await req.json())?.token;
  } catch {
    token = undefined;
  }
  if (!token || typeof token !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await sql`
    insert into fcm_tokens (token, user_id) values (${token}, ${user.id})
    on conflict (token) do update set user_id = excluded.user_id, created_at = now()
  `;
  return NextResponse.json({ ok: true });
}

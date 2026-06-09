import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getParticipation, listMessages } from "@/lib/queries/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Messages d'une conversation (polling) + marque comme lus. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const part = await getParticipation(id);
  if (!part) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const messages = await listMessages(id);
  // Marque les messages recus comme lus
  await sql`
    update messages set read_at = now()
    where conversation_id = ${id} and sender_id <> ${part.userId} and read_at is null
  `;
  return NextResponse.json({ me: part.userId, messages });
}

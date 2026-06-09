import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  getParticipation,
  listMessages,
  touchPresence,
  isUserOnline,
} from "@/lib/queries/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Messages d'une conversation (polling) + presence + lus. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const part = await getParticipation(id);
  if (!part) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Presence de l'utilisateur courant
  await touchPresence(part.userId);

  const messages = await listMessages(id);
  // Marque les messages recus comme lus
  await sql`
    update messages set read_at = now()
    where conversation_id = ${id} and sender_id <> ${part.userId} and read_at is null
  `;

  // L'autre partie est-elle en ligne ?
  const otherId = part.isClient ? part.vendor_user : part.client_id;
  const otherOnline = await isUserOnline(otherId);

  return NextResponse.json({ me: part.userId, otherOnline, messages });
}

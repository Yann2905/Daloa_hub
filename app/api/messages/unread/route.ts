import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUnreadMessageCount, touchPresence } from "@/lib/queries/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Nombre de messages non lus (pour le badge de l'entete). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });
  await touchPresence(user.id);
  const count = await getUnreadMessageCount(user.id);
  return NextResponse.json({ count });
}

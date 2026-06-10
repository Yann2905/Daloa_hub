import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Identifiants des produits favoris de l'utilisateur courant. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ids: [] });
  const rows = await sql<{ product_id: string }[]>`
    select product_id from favorites where user_id = ${user.id}
  `;
  return NextResponse.json({ ids: rows.map((r) => r.product_id) });
}

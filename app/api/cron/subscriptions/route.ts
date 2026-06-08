import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron quotidien (Vercel Cron) : expire les abonnements echus, masque les
 * boutiques concernees et notifie les vendeurs.
 * Securise par l'en-tete Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const [row] = await sql<{ expire_subscriptions: number }[]>`
      select expire_subscriptions()
    `;
    return NextResponse.json({
      ok: true,
      expired: row?.expire_subscriptions ?? 0,
      ranAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 },
    );
  }
}

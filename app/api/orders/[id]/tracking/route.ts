import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Position en direct du livreur d'une commande (pour le suivi client).
 * Accessible uniquement aux parties prenantes de la commande.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const [row] = await sql<
    {
      client_id: string;
      vendor_user: string;
      driver_user: string | null;
      dest_lat: number | null;
      dest_lng: number | null;
      driver_lat: number | null;
      driver_lng: number | null;
      driver_name: string | null;
      driver_phone: string | null;
    }[]
  >`
    select o.client_id, o.dest_lat, o.dest_lng, v.user_id as vendor_user,
           d.user_id as driver_user, d.lat as driver_lat, d.lng as driver_lng,
           du.full_name as driver_name, du.phone as driver_phone
    from orders o
    join vendors v on v.id = o.vendor_id
    left join drivers d on d.id = o.driver_id
    left join users du on du.id = d.user_id
    where o.id = ${id} limit 1
  `;
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const allowed =
    user.role === "admin" ||
    user.id === row.client_id ||
    user.id === row.vendor_user ||
    user.id === row.driver_user;
  if (!allowed) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  return NextResponse.json({
    driver:
      row.driver_lat != null && row.driver_lng != null
        ? {
            lat: row.driver_lat,
            lng: row.driver_lng,
            name: row.driver_name,
            phone: row.driver_phone,
          }
        : null,
    dest:
      row.dest_lat != null && row.dest_lng != null
        ? { lat: row.dest_lat, lng: row.dest_lng }
        : null,
  });
}

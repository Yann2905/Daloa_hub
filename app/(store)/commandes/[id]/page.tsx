import { notFound } from "next/navigation";
import { MapPin, Package, Store } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/queries/orders";
import { sql } from "@/lib/db";
import { formatFcfa, formatDateTime } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  DELIVERY_TYPE_LABELS,
  REFUSAL_NOTICE,
} from "@/lib/constants";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderActions } from "@/components/order/order-actions";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  // Securite : seul le client, le vendeur, le livreur concernes ou un admin
  // peuvent consulter cette commande (evite l'acces par devinette d'URL / IDOR).
  const isStakeholder =
    order.client_id === user.id ||
    order.vendors?.user_id === user.id ||
    order.drivers?.user_id === user.id ||
    user.role === "admin";
  if (!isStakeholder) notFound();

  // A-t-on deja note cette commande ?
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from ratings
    where order_id = ${order.id} and rater_id = ${user.id}
  `;
  const alreadyRated = n > 0;

  const isClient = order.client_id === user.id;

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <AutoRefresh seconds={12} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commande {order.code}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.refused && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Commande refusee</p>
          <p className="text-muted-foreground">{REFUSAL_NOTICE}</p>
          {order.refusal_reason && (
            <p className="mt-1 text-muted-foreground">Motif : {order.refusal_reason}</p>
          )}
        </div>
      )}

      {/* Articles */}
      <section className="rounded-lg border bg-card">
        <h2 className="flex items-center gap-2 border-b p-4 font-semibold">
          <Package className="size-4 text-brand-green" /> Articles
        </h2>
        <ul className="divide-y">
          {order.order_items.map((it) => (
            <li key={it.id} className="flex justify-between p-4 text-sm">
              <span>{it.quantity} x {it.name}</span>
              <span className="font-medium">{formatFcfa(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatFcfa(order.subtotal)}</span>
          </div>
          {order.fulfillment_type === "pickup" ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retrait en boutique</span>
              <span className="text-brand-green">Gratuit</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Livraison ({DELIVERY_TYPE_LABELS[order.delivery_type]}, {order.distance_km} km)
              </span>
              <span>{formatFcfa(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total {order.fulfillment_type === "pickup" ? "(en boutique)" : "(a la livraison)"}</span>
            <span>{formatFcfa(order.refused ? order.delivery_fee : order.total)}</span>
          </div>
        </div>
      </section>

      {/* Mode de reception */}
      <section className="rounded-lg border bg-card p-4">
        {order.fulfillment_type === "pickup" ? (
          <>
            <h2 className="flex items-center gap-2 font-semibold">
              <Store className="size-4 text-brand-green" /> Retrait en boutique
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous recuperez votre commande directement en boutique. Vous serez
              notifie des qu&apos;elle sera prete.
            </p>
          </>
        ) : (
          <>
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-brand-green" /> Livraison a domicile
            </h2>
            {order.dest_address && (
              <p className="mt-2 text-sm text-muted-foreground">{order.dest_address}</p>
            )}
          </>
        )}
      </section>

      {/* Suivi */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Suivi</h2>
        <ol className="mt-3 space-y-3">
          {order.order_status_history
            .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
            .map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                <span className="size-2 rounded-full bg-brand-green" />
                <span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span>
                <span className="text-muted-foreground">{formatDateTime(h.created_at)}</span>
              </li>
            ))}
        </ol>
      </section>

      {isClient && (
        <OrderActions
          orderId={order.id}
          vendorId={order.vendor_id}
          driverId={order.driver_id}
          status={order.status}
          alreadyRated={alreadyRated}
        />
      )}
    </div>
  );
}

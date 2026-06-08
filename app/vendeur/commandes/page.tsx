import { getMyVendor, listVendorOrders } from "@/lib/queries/vendor";
import { formatFcfa, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderManage } from "@/components/vendor/order-manage";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const orders = await listVendorOrders(vendor.id);

  return (
    <div className="space-y-4">
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-bold">Commandes</h1>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Aucune commande pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.code}</span>
                    <OrderStatusBadge status={o.status} />
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {o.fulfillment_type === "pickup" ? "Retrait" : "Livraison"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.order_items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  {o.dest_address && (
                    <p className="text-xs text-muted-foreground">Livraison : {o.dest_address}</p>
                  )}
                </div>
                <p className="font-bold">{formatFcfa(o.total)}</p>
              </div>
              <div className="mt-3">
                <OrderManage orderId={o.id} status={o.status} fulfillment={o.fulfillment_type} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

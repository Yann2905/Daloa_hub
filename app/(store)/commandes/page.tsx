import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/queries/orders";
import { formatFcfa, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

export default async function OrdersPage() {
  await requireUser();
  const orders = await listMyOrders();

  return (
    <div className="container space-y-4 py-6">
      <h1 className="text-2xl font-bold">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Vous n&apos;avez pas encore de commande.</p>
          <Button asChild>
            <Link href="/produits">Commencer mes achats</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/commandes/${o.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-brand-green"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{o.code}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {o.vendors?.shop_name} - {o.order_items.length} article(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(o.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatFcfa(o.total)}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

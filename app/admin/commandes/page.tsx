import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listAllOrders } from "@/lib/queries/admin";
import { formatFcfa, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { AdminSearch } from "@/components/admin/admin-search";
import { Pagination } from "@/components/ui/pagination";
import type { OrderStatus } from "@/lib/database.types";
import type { AdminOrderRow } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };
const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  let orders: AdminOrderRow[] = [];
  let total = 0;
  try {
    const res = await listAllOrders({ status, q, page, pageSize: PAGE_SIZE });
    orders = res.orders;
    total = res.total;
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <AdminSearch placeholder="Code commande, client..." />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {[{ value: "", label: "Toutes" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))].map(
          (f) => {
            const active = (status ?? "") === f.value;
            const sp = new URLSearchParams();
            if (f.value) sp.set("status", f.value);
            if (q) sp.set("q", q);
            return (
              <Link
                key={f.value}
                href={`/admin/commandes?${sp.toString()}`}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "border-primary bg-primary text-white" : "hover:border-primary/40"
                }`}
              >
                {f.label}
              </Link>
            );
          },
        )}
      </div>

      <div className="space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/commandes/${o.id}`}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{o.code}</span>
                <OrderStatusBadge status={o.status as OrderStatus} />
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  {o.fulfillment_type === "pickup" ? "Retrait" : "Livraison"}
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {o.client_name} - {o.shop_name}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
            </div>
            <span className="whitespace-nowrap font-bold">{formatFcfa(o.total)}</span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Aucune commande trouvee.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} />
    </div>
  );
}

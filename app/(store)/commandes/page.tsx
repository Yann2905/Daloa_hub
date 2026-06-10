import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/queries/orders";
import { formatFcfa, formatDateTime, cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { AutoRefresh } from "@/components/util/auto-refresh";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

const TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "cours", label: "En cours", statuses: ["pending", "confirmed", "preparing", "delivering"] },
  { key: "livrees", label: "Livrees", statuses: ["delivered"] },
  { key: "annulees", label: "Annulees / Refusees", statuses: ["refused"] },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireUser();
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  const all = await listMyOrders();
  const counts: Record<string, number> = {};
  for (const t of TABS) counts[t.key] = all.filter((o) => t.statuses.includes(o.status)).length;
  const orders = all.filter((o) => active.statuses.includes(o.status));

  return (
    <div className="container space-y-4 py-6">
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-bold tracking-tight">Mes commandes</h1>

      {/* Onglets */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/commandes?tab=${t.key}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95",
              active.key === t.key
                ? "border-transparent bg-gradient-to-r from-brand-green to-emerald-600 text-white shadow-soft"
                : "hover:border-primary/40 hover:text-primary",
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-bold",
                  active.key === t.key ? "bg-white/25" : "bg-secondary",
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <ClipboardList className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune commande dans « {active.label} ».</p>
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
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-brand-green"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{o.code}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {o.vendors?.shop_name} - {o.order_items.length} article(s)
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatFcfa(o.total)}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

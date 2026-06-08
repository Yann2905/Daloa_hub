import Link from "next/link";
import {
  Users,
  Store,
  Truck,
  ShoppingBag,
  Wallet,
  Flag,
  Clock,
  TrendingUp,
  UserPlus,
  Star,
} from "lucide-react";
import {
  getPlatformStats,
  getDailySeries,
  getTodayStats,
  getRecentOrders,
  getTopVendors,
} from "@/lib/queries/admin";
import { formatFcfa, formatDateTime } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersChart, UsersChart } from "@/components/admin/charts";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import type { OrderStatus } from "@/lib/database.types";

export default async function AdminDashboard() {
  let stats = { users: 0, vendorsActive: 0, driversActive: 0, orders: 0, subscriptionRevenue: 0, openReports: 0 };
  let today = { ordersToday: 0, revenueToday: 0, newUsersToday: 0, pendingDrivers: 0 };
  let series: Awaited<ReturnType<typeof getDailySeries>> = [];
  let recent: Awaited<ReturnType<typeof getRecentOrders>> = [];
  let top: Awaited<ReturnType<typeof getTopVendors>> = [];
  let configError = false;

  try {
    [stats, today, series, recent, top] = await Promise.all([
      getPlatformStats(),
      getTodayStats(),
      getDailySeries(),
      getRecentOrders(8),
      getTopVendors(5),
    ]);
  } catch {
    configError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {configError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Impossible de charger les statistiques (verifiez la connexion Neon).
        </div>
      )}

      {/* Aujourd'hui */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Commandes aujourd'hui" value={today.ordersToday} icon={ShoppingBag} />
        <StatCard label="Revenus du jour" value={formatFcfa(today.revenueToday)} icon={TrendingUp} tone="blue" />
        <StatCard label="Nouveaux utilisateurs" value={today.newUsersToday} icon={UserPlus} />
        <StatCard label="Livreurs en attente" value={today.pendingDrivers} icon={Clock} tone="blue" />
      </div>

      {/* Totaux plateforme */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Utilisateurs" value={stats.users} icon={Users} />
        <StatCard label="Vendeurs actifs" value={stats.vendorsActive} icon={Store} tone="blue" />
        <StatCard label="Livreurs actifs" value={stats.driversActive} icon={Truck} />
        <StatCard label="Commandes totales" value={stats.orders} icon={ShoppingBag} tone="blue" />
        <StatCard label="Revenus abonnements" value={formatFcfa(stats.subscriptionRevenue)} icon={Wallet} />
        <StatCard label="Signalements ouverts" value={stats.openReports} icon={Flag} tone="blue" />
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OrdersChart data={series} />
        <UsersChart data={series} />
      </div>

      {/* Activite recente + Top vendeurs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Commandes recentes</h2>
            <Link href="/admin/commandes" className="text-sm font-medium text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune commande.</p>
          ) : (
            <div className="divide-y">
              {recent.map((o) => (
                <Link
                  key={o.id}
                  href={`/commandes/${o.id}`}
                  className="flex items-center justify-between gap-2 py-2.5 text-sm transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{o.code}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.client_name} - {o.shop_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status as OrderStatus} />
                    <span className="whitespace-nowrap font-semibold">{formatFcfa(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">Top vendeurs</h2>
          {top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun vendeur.</p>
          ) : (
            <div className="space-y-3">
              {top.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.shop_name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {v.rating_avg.toFixed(1)} - {v.orders} commande(s)
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold">{formatFcfa(v.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

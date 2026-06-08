import { Users, Store, Truck, ShoppingBag, Wallet, Flag } from "lucide-react";
import { getPlatformStats, getDailySeries } from "@/lib/queries/admin";
import { formatFcfa } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersChart, UsersChart } from "@/components/admin/charts";

export default async function AdminDashboard() {
  let stats = {
    users: 0,
    vendorsActive: 0,
    driversActive: 0,
    orders: 0,
    subscriptionRevenue: 0,
    openReports: 0,
  };
  let series: Awaited<ReturnType<typeof getDailySeries>> = [];
  let configError = false;

  try {
    [stats, series] = await Promise.all([getPlatformStats(), getDailySeries()]);
  } catch {
    configError = true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {configError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Impossible de charger les statistiques (verifiez la connexion a la base
          de donnees Neon).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Utilisateurs" value={stats.users} icon={Users} />
        <StatCard label="Vendeurs actifs" value={stats.vendorsActive} icon={Store} />
        <StatCard label="Livreurs actifs" value={stats.driversActive} icon={Truck} />
        <StatCard label="Commandes" value={stats.orders} icon={ShoppingBag} />
        <StatCard label="Revenus abonnements" value={formatFcfa(stats.subscriptionRevenue)} icon={Wallet} />
        <StatCard label="Signalements ouverts" value={stats.openReports} icon={Flag} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OrdersChart data={series} />
        <UsersChart data={series} />
      </div>
    </div>
  );
}

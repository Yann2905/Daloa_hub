import Link from "next/link";
import { Package, ShoppingBag, Clock, Wallet, AlertTriangle, Star, MapPin } from "lucide-react";
import {
  getMyVendor,
  getVendorStats,
  getActiveSubscription,
} from "@/lib/queries/vendor";
import { formatFcfa, formatDate } from "@/lib/utils";
import { SUBSCRIPTION_EXPIRED_MESSAGE } from "@/lib/constants";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";

export default async function VendorDashboard() {
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const [stats, sub] = await Promise.all([
    getVendorStats(vendor.id),
    getActiveSubscription(vendor.id),
  ]);

  const subActive = sub?.status === "active" && new Date(sub.end_date) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{vendor.shop_name}</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activite</p>
      </div>

      {!subActive && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{SUBSCRIPTION_EXPIRED_MESSAGE}</p>
              <p className="text-sm text-amber-700">
                Votre boutique et vos produits sont masques tant que l&apos;abonnement
                n&apos;est pas actif.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/vendeur/abonnement">Renouveler (1000 FCFA)</Link>
          </Button>
        </div>
      )}

      {vendor.lat == null && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Position de la boutique requise</p>
              <p className="text-sm text-amber-700">
                Tant que la position n&apos;est pas definie, vos produits sont masques et
                les livreurs ne peuvent pas vous trouver.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/vendeur/boutique">Definir la position</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Produits" value={stats.productCount} icon={Package} hint={`${stats.activeProducts} actifs`} />
        <StatCard label="Commandes" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard label="En attente" value={stats.pendingOrders} icon={Clock} />
        <StatCard label="Revenus livres" value={formatFcfa(stats.revenue)} icon={Wallet} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="size-4 text-amber-400" /> Note moyenne
          </p>
          <p className="mt-1 text-xl font-bold">
            {vendor.rating_count > 0 ? `${vendor.rating_avg.toFixed(1)} / 5` : "Pas encore notee"}
          </p>
          <p className="text-xs text-muted-foreground">{vendor.rating_count} avis</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Abonnement</p>
          {sub ? (
            <>
              <p className="mt-1 text-xl font-bold">{subActive ? "Actif" : "Expire"}</p>
              <p className="text-xs text-muted-foreground">
                Echeance : {formatDate(sub.end_date)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xl font-bold">Aucun</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/vendeur/produits/nouveau">Ajouter un produit</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vendeur/commandes">Voir les commandes</Link>
        </Button>
      </div>
    </div>
  );
}

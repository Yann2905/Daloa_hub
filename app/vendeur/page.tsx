import Link from "next/link";
import { Package, ShoppingBag, Clock, Wallet, AlertTriangle, Star, MapPin, CheckCircle2, Circle } from "lucide-react";
import {
  getMyVendor,
  getVendorStats,
  getActiveSubscription,
  getVendorDailyOrders,
} from "@/lib/queries/vendor";
import { formatFcfa, formatDate } from "@/lib/utils";
import { SUBSCRIPTION_EXPIRED_MESSAGE } from "@/lib/constants";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { Button } from "@/components/ui/button";

export default async function VendorDashboard() {
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const [stats, sub, dailyOrders] = await Promise.all([
    getVendorStats(vendor.id),
    getActiveSubscription(vendor.id),
    getVendorDailyOrders(vendor.id),
  ]);

  const subActive = sub?.status === "active" && new Date(sub.end_date) > new Date();

  // Guide de demarrage (premiers pas du vendeur)
  const steps = [
    { done: vendor.lat != null, label: "Definir la position de la boutique", href: "/vendeur/boutique" },
    { done: !!vendor.logo_url, label: "Ajouter un logo de boutique", href: "/vendeur/boutique" },
    { done: stats.productCount > 0, label: "Ajouter votre premier produit", href: "/vendeur/produits/nouveau" },
    { done: subActive, label: "Activer votre abonnement", href: "/vendeur/abonnement" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

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

      {doneCount < steps.length && (
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Bien demarrer</p>
            <span className="text-sm text-muted-foreground">{doneCount}/{steps.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-orange transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground line-through">{s.label}</span>
                  </>
                ) : (
                  <>
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                    <Link href={s.href} className="font-medium hover:text-primary">{s.label}</Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Produits" value={stats.productCount} icon={Package} hint={`${stats.activeProducts} actifs`} />
        <StatCard label="Commandes" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard label="En attente" value={stats.pendingOrders} icon={Clock} />
        <StatCard label="Revenus livres" value={formatFcfa(stats.revenue)} icon={Wallet} />
      </div>

      {dailyOrders.length > 0 && (
        <BarChart data={dailyOrders} title="Commandes (7 derniers jours)" />
      )}

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

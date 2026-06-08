import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Wallet,
  Store,
  Truck,
  Package,
  Star,
} from "lucide-react";
import { getUserFull } from "@/lib/queries/admin";
import { formatFcfa, formatDate, formatDateTime, initials } from "@/lib/utils";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  AccountToggle,
  RoleChanger,
  NotifyUser,
  VendorValidation,
  DriverValidation,
  ViewDocument,
} from "@/components/admin/admin-actions";
import type { OrderStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendor: "Vendeur",
  driver: "Livreur",
  admin: "Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUserFull(id);
  if (!data) notFound();
  const { profile, asClient, vendor, driver, recentOrders } = data;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/utilisateurs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Retour aux utilisateurs
      </Link>

      {/* En-tete profil */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-gradient text-xl font-bold text-white">
          {initials(profile.full_name)}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
            {profile.account_status === "suspended" && <Badge variant="destructive">Suspendu</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {profile.email && <span className="flex items-center gap-1"><Mail className="size-3.5" />{profile.email}</span>}
            {profile.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" />{profile.phone}</span>}
            {profile.address && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{profile.address}</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inscrit le {formatDate(profile.created_at)}</p>
        </div>
      </div>

      {/* Actions administrateur */}
      {profile.role !== "admin" && (
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            <AccountToggle userId={profile.id} status={profile.account_status} />
            <RoleChanger userId={profile.id} role={profile.role} />
          </div>
          <NotifyUser userId={profile.id} />
        </div>
      )}

      {/* Activite client */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Commandes passees" value={asClient.orders} icon={ShoppingBag} />
        <StatCard label="Total depense" value={formatFcfa(asClient.spent)} icon={Wallet} tone="blue" />
        {vendor && <StatCard label="Produits" value={vendor.products} icon={Package} />}
        {vendor && <StatCard label="Revenus boutique" value={formatFcfa(vendor.revenue)} icon={Wallet} tone="blue" />}
        {driver && <StatCard label="Livraisons" value={driver.deliveries} icon={Truck} />}
      </div>

      {/* Bloc vendeur */}
      {vendor && (
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Store className="size-4 text-primary" /> Boutique : {vendor.shop_name}
            </h2>
            <Badge variant={vendor.status === "approved" ? "success" : vendor.status === "rejected" ? "destructive" : "warning"}>
              {vendor.status === "approved" ? "Validee" : vendor.status === "rejected" ? "Rejetee" : "En attente"}
            </Badge>
          </div>
          {vendor.rating_count > 0 && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" /> {vendor.rating_avg.toFixed(1)} ({vendor.rating_count} avis)
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <VendorValidation vendorId={vendor.id} status={vendor.status} />
            <Link href={`/boutique/${vendor.id}`} className="text-sm font-medium text-primary hover:underline" target="_blank">
              Voir la boutique
            </Link>
          </div>
        </div>
      )}

      {/* Bloc livreur */}
      {driver && (
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Truck className="size-4 text-primary" /> Livreur ({driver.vehicle_type ?? "vehicule non renseigne"})
            </h2>
            <Badge variant={driver.status === "approved" ? "success" : driver.status === "rejected" ? "destructive" : "warning"}>
              {DRIVER_STATUS_LABELS[driver.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ViewDocument path={driver.cni_url} label="CNI" />
            <ViewDocument path={driver.vehicle_doc_url} label="Vehicule" />
            <div className="ml-auto"><DriverValidation driverId={driver.id} status={driver.status} /></div>
          </div>
        </div>
      )}

      {/* Dernieres commandes */}
      <div className="rounded-xl border bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-semibold">Dernieres commandes (client)</h2>
        {recentOrders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <div className="divide-y">
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/commandes/${o.id}`} className="flex items-center justify-between py-2.5 text-sm hover:bg-secondary/50">
                <div>
                  <p className="font-medium">{o.code}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status as OrderStatus} />
                  <span className="font-semibold">{formatFcfa(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

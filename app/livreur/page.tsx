import Link from "next/link";
import { Clock, XCircle, Star, Truck } from "lucide-react";
import { getMyDriver, listDriverDeliveries } from "@/lib/queries/driver";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { AvailabilityToggle } from "@/components/driver/availability-toggle";
import { DeliveryCard } from "@/components/driver/delivery-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";

export default async function DriverDashboard() {
  const driver = await getMyDriver();
  if (!driver) return null;

  // Compte non valide : on guide vers la soumission des documents.
  if (driver.status !== "approved") {
    const Icon = driver.status === "rejected" ? XCircle : Clock;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Espace livreur</h1>
        <div className="flex items-start gap-3 rounded-lg border bg-card p-5">
          <Icon className={driver.status === "rejected" ? "size-6 text-destructive" : "size-6 text-amber-500"} />
          <div>
            <p className="font-semibold">Statut : {DRIVER_STATUS_LABELS[driver.status]}</p>
            <p className="text-sm text-muted-foreground">
              {driver.status === "rejected"
                ? "Votre dossier a ete rejete. Corrigez vos documents et soumettez a nouveau."
                : "Votre dossier est en cours de verification. Vous ne pouvez pas encore recevoir de livraisons."}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/livreur/documents">
            {driver.cni_url ? "Mettre a jour mes documents" : "Televerser mes documents"}
          </Link>
        </Button>
      </div>
    );
  }

  const active = await listDriverDeliveries(driver.id, { activeOnly: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Gerez votre disponibilite et vos livraisons</p>
      </div>

      <AvailabilityToggle initial={driver.is_available} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Livraisons en cours" value={active.length} icon={Truck} />
        <StatCard
          label="Note moyenne"
          value={driver.rating_count > 0 ? driver.rating_avg.toFixed(1) : "-"}
          icon={Star}
          hint={`${driver.rating_count} avis`}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Livraisons a effectuer</h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucune livraison en cours. Restez en ligne pour en recevoir.
          </p>
        ) : (
          active.map((o) => (
            <DeliveryCard
              key={o.id}
              order={{
                id: o.id,
                code: o.code,
                status: o.status,
                total: o.total,
                delivery_fee: o.delivery_fee,
                dest_address: o.dest_address,
                dest_lat: o.dest_lat,
                dest_lng: o.dest_lng,
                items: o.order_items.map((it) => `${it.quantity}x ${it.name}`).join(", "),
                clientPhone: o.profiles?.phone ?? null,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

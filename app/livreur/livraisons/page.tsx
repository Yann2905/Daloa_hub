import { getMyDriver, listDriverDeliveries } from "@/lib/queries/driver";
import { DeliveryCard } from "@/components/driver/delivery-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Livraisons" };

export default async function DriverDeliveriesPage() {
  const driver = await getMyDriver();
  if (!driver) return null;
  if (driver.status !== "approved") {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Votre compte doit etre valide pour acceder aux livraisons.
      </p>
    );
  }

  const deliveries = await listDriverDeliveries(driver.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mes livraisons</h1>
      {deliveries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Aucune livraison pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {deliveries.map((o) => (
            <DeliveryCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

import { getMyVendor, listVendorOrders } from "@/lib/queries/vendor";
import { VendorOrderCard } from "@/components/vendor/vendor-order-card";
import { AdminSearch } from "@/components/admin/admin-search";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const orders = await listVendorOrders(vendor.id, q);

  return (
    <div className="space-y-4">
      <AutoRefresh seconds={15} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <AdminSearch placeholder="Code commande ou tel. client..." />
      </div>
      <p className="text-sm text-muted-foreground">
        A la remise : recherchez la commande (code ou numero du client), verifiez
        l&apos;identite du livreur, puis confiez le colis.
      </p>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Aucune commande trouvee.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <VendorOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

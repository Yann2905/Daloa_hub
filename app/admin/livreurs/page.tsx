import { listDriversForAdmin, type DriverAdminRow } from "@/lib/queries/admin";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DriverValidation, ViewDocument } from "@/components/admin/admin-actions";
import { DriverCertifyToggle } from "@/components/admin/driver-certify-toggle";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export const metadata = { title: "Validation livreurs" };

type Row = DriverAdminRow;

export default async function AdminDriversPage() {
  let drivers: Row[] = [];
  try {
    drivers = await listDriversForAdmin();
  } catch {
    drivers = [];
  }

  const badge = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "destructive" : "warning";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Livreurs</h1>
      <div className="space-y-3">
        {drivers.map((d) => (
          <div key={d.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 font-medium">
                  {d.profiles?.full_name ?? "Livreur"}
                  {d.verified && <VerifiedBadge />}
                </p>
                <p className="text-sm text-muted-foreground">
                  {d.profiles?.phone} - {d.vehicle_type ?? "Vehicule non renseigne"}
                </p>
                <p className="text-xs text-muted-foreground">Inscrit le {formatDate(d.created_at)}</p>
              </div>
              <Badge variant={badge(d.status)}>{DRIVER_STATUS_LABELS[d.status]}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ViewDocument path={d.cni_url} label="CNI" />
              <ViewDocument path={d.vehicle_doc_url} label="Vehicule" />
              <div className="ml-auto flex gap-2">
                {d.status === "approved" && <DriverCertifyToggle driverId={d.id} verified={d.verified} />}
                <DriverValidation driverId={d.id} status={d.status} />
              </div>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucun livreur (ou configuration Supabase manquante).
          </p>
        )}
      </div>
    </div>
  );
}

import { getMyDriver } from "@/lib/queries/driver";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { DocumentsForm } from "@/components/driver/documents-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Mes documents" };

export default async function DriverDocumentsPage() {
  const driver = await getMyDriver();
  if (!driver) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <Badge variant={driver.status === "approved" ? "success" : driver.status === "rejected" ? "destructive" : "warning"}>
          {DRIVER_STATUS_LABELS[driver.status]}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Televersez votre CNI et le document de votre vehicule. Un administrateur
        validera votre compte avant que vous puissiez livrer.
      </p>
      <DocumentsForm driver={driver} />
    </div>
  );
}

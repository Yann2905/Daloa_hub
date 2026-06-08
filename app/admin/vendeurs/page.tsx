import { listVendorsForAdmin, type VendorAdminRow } from "@/lib/queries/admin";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VendorValidation } from "@/components/admin/admin-actions";

export const metadata = { title: "Validation vendeurs" };

type Row = VendorAdminRow;

export default async function AdminVendorsPage() {
  let vendors: Row[] = [];
  try {
    vendors = await listVendorsForAdmin();
  } catch {
    vendors = [];
  }

  const badge = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "destructive" : "warning";
  const label = (s: string) =>
    s === "approved" ? "Valide" : s === "rejected" ? "Rejete" : "En attente";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendeurs</h1>
      <div className="space-y-3">
        {vendors.map((v) => (
          <div key={v.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{v.shop_name}</p>
                <p className="text-sm text-muted-foreground">
                  {v.profiles?.full_name} - {v.profiles?.phone}
                </p>
                <p className="text-xs text-muted-foreground">Cree le {formatDate(v.created_at)}</p>
              </div>
              <Badge variant={badge(v.status)}>{label(v.status)}</Badge>
            </div>
            <div className="mt-3 flex justify-end">
              <VendorValidation vendorId={v.id} status={v.status} />
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucun vendeur (ou configuration Supabase manquante).
          </p>
        )}
      </div>
    </div>
  );
}

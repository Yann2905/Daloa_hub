import { listReportsForAdmin, type ReportAdminRow } from "@/lib/queries/admin";
import { REPORT_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ReportResolve } from "@/components/admin/admin-actions";

export const metadata = { title: "Signalements" };

type Row = ReportAdminRow;

const TYPE_LABEL = Object.fromEntries(REPORT_TYPES.map((t) => [t.value, t.label]));
const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert",
  reviewing: "En cours",
  resolved: "Resolu",
  dismissed: "Rejete",
};

export default async function AdminReportsPage() {
  let reports: Row[] = [];
  try {
    reports = await listReportsForAdmin();
  } catch {
    reports = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Signalements</h1>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{TYPE_LABEL[r.type] ?? r.type}</Badge>
                  <Badge variant={r.status === "open" ? "warning" : "secondary"}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{r.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Par {r.profiles?.full_name ?? "?"}
                  {r.orders?.code ? ` - Commande ${r.orders.code}` : ""} - {formatDateTime(r.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <ReportResolve reportId={r.id} status={r.status} />
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucun signalement.
          </p>
        )}
      </div>
    </div>
  );
}

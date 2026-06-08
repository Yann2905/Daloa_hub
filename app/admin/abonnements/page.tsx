import { listSubscriptionsForAdmin, type SubscriptionAdminRow } from "@/lib/queries/admin";
import { formatFcfa, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Abonnements" };

type Row = SubscriptionAdminRow;

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  expired: "Expire",
  cancelled: "Annule",
};

export default async function AdminSubscriptionsPage() {
  let subs: Row[] = [];
  let revenue = 0;
  try {
    const res = await listSubscriptionsForAdmin();
    subs = res.subs;
    revenue = res.revenue;
  } catch {
    subs = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <div className="rounded-lg border bg-card px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Revenus totaux</p>
          <p className="font-bold">{formatFcfa(revenue)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary text-left">
            <tr>
              <th className="p-3">Boutique</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Debut</th>
              <th className="p-3">Echeance</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium">{s.vendors?.shop_name ?? "-"}</td>
                <td className="p-3">{formatFcfa(s.amount)}</td>
                <td className="p-3">{formatDate(s.start_date)}</td>
                <td className="p-3">{formatDate(s.end_date)}</td>
                <td className="p-3">
                  <Badge variant={s.status === "active" ? "success" : "secondary"}>
                    {STATUS_LABEL[s.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Aucun abonnement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

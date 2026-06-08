import { CheckCircle2, XCircle } from "lucide-react";
import {
  getMyVendor,
  getActiveSubscription,
  getVendorPayments,
} from "@/lib/queries/vendor";
import { formatFcfa, formatDate, formatDateTime } from "@/lib/utils";
import { SUBSCRIPTION_AMOUNT_FCFA } from "@/lib/constants";
import { RenewSubscription } from "@/components/vendor/renew-subscription";
import type { Payment } from "@/lib/database.types";

export const metadata = { title: "Abonnement" };

export default async function SubscriptionPage() {
  const vendor = await getMyVendor();
  if (!vendor) return null;

  const sub = await getActiveSubscription(vendor.id);
  const active = sub?.status === "active" && new Date(sub.end_date) > new Date();

  const payments = await getVendorPayments(vendor.user_id);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Abonnement vendeur</h1>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          {active ? (
            <CheckCircle2 className="size-8 text-brand-green" />
          ) : (
            <XCircle className="size-8 text-destructive" />
          )}
          <div>
            <p className="text-lg font-bold">{active ? "Abonnement actif" : "Aucun abonnement actif"}</p>
            {sub && (
              <p className="text-sm text-muted-foreground">
                {active ? "Expire le" : "Expire depuis le"} {formatDate(sub.end_date)}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          L&apos;abonnement coute {formatFcfa(SUBSCRIPTION_AMOUNT_FCFA)} par mois. Sans
          abonnement actif, votre boutique et vos produits sont masques et l&apos;acces
          vendeur est limite.
        </p>

        <div className="mt-4">
          <RenewSubscription />
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Historique des paiements</h2>
        {!payments || payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistre.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {(payments as Payment[]).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span className="text-muted-foreground">{formatDateTime(p.created_at)}</span>
                <span className="font-medium">{formatFcfa(p.amount)}</span>
                <span className="text-brand-green">{p.status === "paid" ? "Paye" : p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

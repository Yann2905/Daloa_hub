"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Flag, XCircle } from "lucide-react";
import { refuseOrder, reportOrder, rateOrder } from "@/lib/actions/orders";
import { REFUSAL_NOTICE, REPORT_TYPES, type ReportType } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";

interface Props {
  orderId: string;
  vendorId: string;
  driverId: string | null;
  status: string;
  alreadyRated: boolean;
}

export function OrderActions({ orderId, vendorId, driverId, status, alreadyRated }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [panel, setPanel] = useState<"refuse" | "report" | "rate" | null>(null);
  const [busy, setBusy] = useState(false);

  // Refus
  const [refuseReason, setRefuseReason] = useState("");
  // Signalement
  const [reportType, setReportType] = useState<ReportType>("non_conform");
  const [reportMsg, setReportMsg] = useState("");
  // Notation
  const [vendorStars, setVendorStars] = useState(5);
  const [driverStars, setDriverStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const canRefuse = status === "delivering";
  const canRate = status === "delivered" && !alreadyRated;

  async function doRefuse() {
    if (!refuseReason.trim()) {
      toast({ title: "Motif requis", variant: "error" });
      return;
    }
    setBusy(true);
    const res = await refuseOrder(orderId, refuseReason);
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: "Commande refusee", description: REFUSAL_NOTICE, variant: "success" });
    setPanel(null);
    router.refresh();
  }

  async function doReport() {
    setBusy(true);
    const res = await reportOrder({ orderId, type: reportType, message: reportMsg });
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: "Signalement envoye", variant: "success" });
    setPanel(null);
    setReportMsg("");
  }

  async function doRate() {
    setBusy(true);
    const res = await rateOrder({
      orderId,
      vendorId,
      driverId,
      vendorStars,
      driverStars: driverId ? driverStars : undefined,
      comment: ratingComment,
    });
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: "Merci pour votre evaluation", variant: "success" });
    setPanel(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canRefuse && (
          <Button variant="destructive" onClick={() => setPanel("refuse")}>
            <XCircle className="size-4" /> Refuser le produit
          </Button>
        )}
        {canRate && (
          <Button onClick={() => setPanel("rate")}>
            <Star className="size-4" /> Evaluer
          </Button>
        )}
        <Button variant="outline" onClick={() => setPanel("report")}>
          <Flag className="size-4" /> Signaler un probleme
        </Button>
      </div>

      {panel === "refuse" && (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{REFUSAL_NOTICE}</p>
          <Textarea
            placeholder="Motif du refus"
            value={refuseReason}
            onChange={(e) => setRefuseReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="destructive" onClick={doRefuse} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Confirmer le refus
            </Button>
            <Button variant="ghost" onClick={() => setPanel(null)}>Annuler</Button>
          </div>
        </div>
      )}

      {panel === "report" && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <Label>Type de probleme</Label>
            <Select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <Textarea
            placeholder="Decrivez le probleme"
            value={reportMsg}
            onChange={(e) => setReportMsg(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={doReport} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Envoyer
            </Button>
            <Button variant="ghost" onClick={() => setPanel(null)}>Annuler</Button>
          </div>
        </div>
      )}

      {panel === "rate" && (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <Label>Note du vendeur</Label>
            <StarRating value={vendorStars} onChange={setVendorStars} />
          </div>
          {driverId && (
            <div className="space-y-1">
              <Label>Note du livreur</Label>
              <StarRating value={driverStars} onChange={setDriverStars} />
            </div>
          )}
          <Textarea
            placeholder="Commentaire (facultatif)"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={doRate} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Valider
            </Button>
            <Button variant="ghost" onClick={() => setPanel(null)}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
}

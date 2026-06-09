"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Loader2,
  Info,
  Truck,
  Store,
  Check,
  LocateFixed,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useGeolocation } from "@/lib/use-geolocation";
import { resolveDeliveryType } from "@/lib/delivery";
import {
  DELIVERY_FEES,
  DELIVERY_TYPE_LABELS,
  DEFAULT_CENTER,
} from "@/lib/constants";
import { checkout } from "@/lib/actions/orders";
import { formatFcfa, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Mode = "delivery" | "pickup";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, vendorId, clear, count } = useCart();
  const { toast } = useToast();
  const { coords, status, request } = useGeolocation();

  const [mode, setMode] = useState<Mode>("delivery");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const deliveryType = resolveDeliveryType(
    lines.map((l) => ({ categorySlug: l.categorySlug, isBulky: l.isBulky })),
  );
  const fees = DELIVERY_FEES[deliveryType];
  const isPickup = mode === "pickup";

  if (count === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Votre panier est vide.</p>
        <Button asChild className="mt-4">
          <Link href="/produits">Voir les produits</Link>
        </Button>
      </div>
    );
  }

  async function submit() {
    if (!vendorId) return;
    if (!isPickup && !coords && !address.trim()) {
      toast({
        title: "Position requise",
        description: "Partagez votre position GPS ou indiquez votre quartier.",
        variant: "error",
      });
      return;
    }
    const dest = isPickup ? null : coords ?? DEFAULT_CENTER;
    setSubmitting(true);
    const res = await checkout({
      vendorId,
      fulfillment: mode,
      destLat: dest?.lat ?? null,
      destLng: dest?.lng ?? null,
      destAddress: address,
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        categorySlug: l.categorySlug,
        isBulky: l.isBulky,
      })),
    });
    setSubmitting(false);

    if (res.error) {
      toast({ title: "Commande refusee", description: res.error, variant: "error" });
      return;
    }
    clear();
    toast({ title: "Commande passee", variant: "success" });
    router.push(`/commandes/${res.orderId}`);
  }

  return (
    <div className="container grid gap-6 py-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <h1 className="text-2xl font-bold">Finaliser la commande</h1>

        {/* Mode de reception */}
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <h2 className="font-semibold">Mode de reception</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("delivery")}
              className={cn(
                "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all active:scale-[0.98]",
                mode === "delivery" ? "border-primary bg-primary/5" : "hover:border-primary/40",
              )}
            >
              <Truck className="mt-0.5 size-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Livraison a domicile</p>
                <p className="text-xs text-muted-foreground">Paiement a la livraison. Frais ajoutes.</p>
              </div>
              {mode === "delivery" && <Check className="size-4 text-primary" />}
            </button>
            <button
              type="button"
              onClick={() => setMode("pickup")}
              className={cn(
                "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all active:scale-[0.98]",
                mode === "pickup" ? "border-primary bg-primary/5" : "hover:border-primary/40",
              )}
            >
              <Store className="mt-0.5 size-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Retrait en boutique</p>
                <p className="text-xs text-muted-foreground">Vous recuperez sur place. <strong>Gratuit</strong>.</p>
              </div>
              {mode === "pickup" && <Check className="size-4 text-primary" />}
            </button>
          </div>
        </div>

        {/* Position / adresse : uniquement en livraison */}
        {!isPickup ? (
          <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-primary" /> Ou livrer ?
            </h2>

            {/* Etat GPS */}
            {status === "granted" && coords ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-primary">
                <Check className="size-4 shrink-0" />
                <span>
                  Position detectee (precision ~{Math.round(coords.accuracy)} m). Aucune
                  saisie necessaire.
                </span>
              </div>
            ) : status === "locating" ? (
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Recuperation de votre position...
              </div>
            ) : (
              <Button onClick={request} className="w-full" size="lg">
                <LocateFixed className="size-4" /> Partager ma position GPS
              </Button>
            )}

            {/* Permission refusee : guidage */}
            {status === "denied" && (
              <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  La localisation est bloquee. Touchez le cadenas a gauche de l&apos;adresse
                  du site, autorisez la <strong>localisation</strong>, puis reessayez. Ou
                  indiquez simplement votre quartier ci-dessous.
                </span>
              </div>
            )}
            {status === "unavailable" && (
              <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  GPS indisponible ici (ex : navigateur de WhatsApp). Ouvrez le site dans
                  Chrome/Safari, ou indiquez votre quartier ci-dessous.
                </span>
              </div>
            )}

            {/* Adresse : repli, requise seulement si pas de GPS */}
            <div className="space-y-2">
              <Label htmlFor="address">
                {coords ? "Precision (facultatif)" : "Indiquez votre quartier"}
              </Label>
              <Input
                id="address"
                placeholder="Ex: Quartier Tazibouo, pres de la pharmacie"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {!coords && (
                <p className="text-xs text-muted-foreground">
                  Utile si vous ne partagez pas votre position GPS.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2 rounded-xl border bg-secondary p-3 text-sm">
            <Store className="size-4 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              Vous recuperez votre commande en boutique apres preparation. Vous serez
              notifie quand elle sera prete. Aucun frais de livraison.
            </p>
          </div>
        )}

        {!isPickup && (
          <div className="flex gap-2 rounded-xl border bg-secondary p-3 text-sm">
            <Info className="size-4 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              Le livreur disponible le plus proche vous sera affecte automatiquement.
              Tarif {DELIVERY_TYPE_LABELS[deliveryType]} : {formatFcfa(fees.proximity)} en
              proximite, {formatFcfa(fees.distance)} a distance.
            </p>
          </div>
        )}
      </div>

      {/* Recapitulatif */}
      <div className="h-fit space-y-3 rounded-xl border bg-card p-4 shadow-soft">
        <h2 className="font-semibold">Recapitulatif</h2>
        {lines.map((l) => (
          <div key={l.productId} className="flex justify-between text-sm">
            <span className="line-clamp-1 text-muted-foreground">
              {l.quantity} x {l.name}
            </span>
            <span>{formatFcfa(l.unitPrice * l.quantity)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="font-medium">{formatFcfa(subtotal)}</span>
        </div>
        {isPickup ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Retrait en boutique</span>
            <span className="font-medium text-primary">Gratuit</span>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison ({DELIVERY_TYPE_LABELS[deliveryType]})</span>
            <span className="text-muted-foreground">
              {formatFcfa(fees.proximity)} - {formatFcfa(fees.distance)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>
            {isPickup
              ? formatFcfa(subtotal)
              : `${formatFcfa(subtotal + fees.proximity)} - ${formatFcfa(subtotal + fees.distance)}`}
          </span>
        </div>
        <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isPickup ? "Confirmer le retrait" : "Confirmer la commande"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {isPickup ? "Paiement en boutique au retrait." : "Paiement en especes a la livraison."}
        </p>
      </div>
    </div>
  );
}

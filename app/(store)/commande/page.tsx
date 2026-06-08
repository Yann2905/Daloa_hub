"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Loader2, Info, Truck, Store, Check } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
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

  const [mode, setMode] = useState<Mode>("delivery");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
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

  function locate() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocalisation indisponible", variant: "error" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast({ title: "Position detectee", variant: "success" });
      },
      () => {
        setLocating(false);
        toast({
          title: "Position non partagee",
          description: "Pas de souci : indiquez votre quartier, la commande passera quand meme.",
          variant: "error",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function submit() {
    if (!vendorId) return;
    if (!isPickup && !address.trim()) {
      toast({
        title: "Indiquez votre quartier",
        description: "Ex : Tazibouo, pres de la pharmacie.",
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

        {/* Choix du mode de reception */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Mode de reception</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("delivery")}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                mode === "delivery" ? "border-brand-green bg-brand-green/5" : "hover:border-brand-green/50",
              )}
            >
              <Truck className="mt-0.5 size-5 text-brand-green" />
              <div className="flex-1">
                <p className="font-medium">Livraison a domicile</p>
                <p className="text-xs text-muted-foreground">
                  Paiement a la livraison. Frais de livraison ajoutes.
                </p>
              </div>
              {mode === "delivery" && <Check className="size-4 text-brand-green" />}
            </button>

            <button
              type="button"
              onClick={() => setMode("pickup")}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                mode === "pickup" ? "border-brand-green bg-brand-green/5" : "hover:border-brand-green/50",
              )}
            >
              <Store className="mt-0.5 size-5 text-brand-green" />
              <div className="flex-1">
                <p className="font-medium">Retrait en boutique</p>
                <p className="text-xs text-muted-foreground">
                  Vous recuperez sur place. <strong>Aucun frais</strong>.
                </p>
              </div>
              {mode === "pickup" && <Check className="size-4 text-brand-green" />}
            </button>
          </div>
        </div>

        {/* Adresse / position : uniquement en livraison */}
        {!isPickup ? (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-brand-green" /> Adresse de livraison
            </h2>
            <div className="space-y-2">
              <Label htmlFor="address">Indication / quartier (obligatoire)</Label>
              <Input
                id="address"
                placeholder="Ex: Quartier Tazibouo, pres de la pharmacie"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <Button variant="outline" onClick={locate} disabled={locating} className="w-full">
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {coords ? "Position confirmee" : "Partager ma position GPS (facultatif)"}
            </Button>
            {coords ? (
              <p className="text-xs text-brand-green">
                Position confirmee ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Le GPS ameliore la precision mais n&apos;est pas obligatoire. S&apos;il est
                bloque (ex : navigateur de WhatsApp), ouvrez le site dans Chrome ou Safari.
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-2 rounded-lg border bg-secondary p-3 text-sm">
            <Store className="size-4 shrink-0 text-brand-green" />
            <p className="text-muted-foreground">
              Vous recuperez votre commande directement en boutique apres preparation.
              Vous serez notifie quand elle sera prete. Aucun frais de livraison.
            </p>
          </div>
        )}

        {!isPickup && (
          <div className="flex gap-2 rounded-lg border bg-secondary p-3 text-sm">
            <Info className="size-4 shrink-0 text-brand-green" />
            <p className="text-muted-foreground">
              Le livreur disponible le plus proche vous sera affecte automatiquement.
              Tarif {DELIVERY_TYPE_LABELS[deliveryType]} : {formatFcfa(fees.proximity)} en
              proximite, {formatFcfa(fees.distance)} a distance.
            </p>
          </div>
        )}
      </div>

      {/* Recapitulatif */}
      <div className="h-fit space-y-3 rounded-lg border bg-card p-4">
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
            <span className="font-medium text-brand-green">Gratuit</span>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Livraison ({DELIVERY_TYPE_LABELS[deliveryType]})
            </span>
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
          {isPickup
            ? "Paiement en boutique au retrait."
            : "Paiement en especes a la livraison."}
        </p>
      </div>
    </div>
  );
}

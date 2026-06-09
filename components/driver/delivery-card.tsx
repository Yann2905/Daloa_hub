"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Loader2, Navigation, CheckCircle2, Phone, ChevronUp, Store, MapPin, User } from "lucide-react";
import { completeDelivery } from "@/lib/actions/driver";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";
import type { DeliveryRow } from "@/lib/queries/driver";

const DeliveryMap = dynamic(() => import("./delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-xl border bg-secondary">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function DeliveryCard({ order }: { order: DeliveryRow }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showMap, setShowMap] = useState(false);

  // Avant la remise (confirmed/preparing) -> cap sur la BOUTIQUE.
  // Apres la remise (delivering) -> cap sur le CLIENT.
  const goingToShop = order.status === "confirmed" || order.status === "preparing";
  const shopHasGps = order.shop?.lat != null && order.shop?.lng != null;
  const clientHasGps = order.dest_lat != null && order.dest_lng != null;
  const mapDest = goingToShop
    ? shopHasGps
      ? { lat: order.shop!.lat!, lng: order.shop!.lng! }
      : null
    : clientHasGps
      ? { lat: order.dest_lat!, lng: order.dest_lng! }
      : null;

  function deliver() {
    startTransition(async () => {
      const res = await completeDelivery(order.id);
      if (res.error) toast({ title: res.error, variant: "error" });
      else toast({ title: "Livraison validee", variant: "success" });
    });
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{order.code}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        {order.order_items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
      </p>

      {/* Etape 1 : boutique (retrait) */}
      <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-2.5 text-sm">
        <Store className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">1. Boutique : {order.shop?.name}</p>
          {order.shop?.address && <p className="text-xs text-muted-foreground">{order.shop.address}</p>}
        </div>
      </div>

      {/* Etape 2 : client */}
      <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-2.5 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="font-medium">2. Client : {order.client?.full_name}</p>
          {order.dest_address && <p className="text-xs text-muted-foreground">{order.dest_address}</p>}
        </div>
        {order.client?.phone && (
          <a href={`tel:${order.client.phone}`} className="flex items-center gap-1 text-xs font-medium text-accent">
            <Phone className="size-3.5" /> Appeler
          </a>
        )}
      </div>

      <p className="text-sm">
        Total {formatFcfa(order.total)} - Frais livraison {formatFcfa(order.delivery_fee)}
      </p>

      <div className="flex flex-wrap gap-2">
        {mapDest && (
          <Button variant={showMap ? "secondary" : "accent"} size="sm" onClick={() => setShowMap((v) => !v)}>
            {showMap ? <ChevronUp className="size-4" /> : <Navigation className="size-4" />}
            {showMap ? "Masquer" : goingToShop ? "Itineraire boutique" : "Itineraire client"}
          </Button>
        )}
        {order.status === "delivering" && (
          <Button size="sm" onClick={deliver} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Valider la livraison
          </Button>
        )}
      </div>

      {mapDest && showMap && (
        <div className="animate-in space-y-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            {goingToShop ? <Store className="size-3.5" /> : <User className="size-3.5" />}
            {goingToShop ? "Vers la boutique pour recuperer le colis" : "Vers le client pour livrer"}
          </p>
          <DeliveryMap dest={mapDest} />
        </div>
      )}
    </div>
  );
}

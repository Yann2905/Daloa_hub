"use client";

import { useTransition } from "react";
import { Loader2, Navigation, CheckCircle2, Phone } from "lucide-react";
import { completeDelivery } from "@/lib/actions/driver";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/database.types";

interface Props {
  order: {
    id: string;
    code: string;
    status: OrderStatus;
    total: number;
    delivery_fee: number;
    dest_address: string | null;
    dest_lat: number | null;
    dest_lng: number | null;
    items: string;
    clientPhone: string | null;
  };
}

export function DeliveryCard({ order }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const gpsUrl =
    order.dest_lat != null && order.dest_lng != null
      ? `https://www.openstreetmap.org/directions?to=${order.dest_lat},${order.dest_lng}`
      : null;

  function deliver() {
    startTransition(async () => {
      const res = await completeDelivery(order.id);
      if (res.error) toast({ title: res.error, variant: "error" });
      else toast({ title: "Livraison validee", variant: "success" });
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{order.code}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{order.items}</p>
      {order.dest_address && (
        <p className="mt-1 text-sm">Adresse : {order.dest_address}</p>
      )}
      <p className="mt-1 text-sm">
        Total {formatFcfa(order.total)} - Frais livraison {formatFcfa(order.delivery_fee)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {gpsUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={gpsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-4" /> Navigation GPS
            </a>
          </Button>
        )}
        {order.clientPhone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${order.clientPhone}`}>
              <Phone className="size-4" /> Appeler
            </a>
          </Button>
        )}
        {order.status === "delivering" && (
          <Button size="sm" onClick={deliver} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Valider la livraison
          </Button>
        )}
      </div>
    </div>
  );
}

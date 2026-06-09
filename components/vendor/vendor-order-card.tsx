"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Phone, Eye, Loader2, IdCard, Wallet, User, Bike } from "lucide-react";
import { getDriverCni, markVendorSettled } from "@/lib/actions/vendor";
import { OrderManage } from "./order-manage";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderItemsList } from "@/components/order/order-items-list";
import { formatFcfa, formatDateTime, initials } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VendorOrderRow } from "@/lib/queries/vendor";

export function VendorOrderCard({ order }: { order: VendorOrderRow }) {
  const { toast } = useToast();
  const [pendingCni, startCni] = useTransition();
  const [pendingSettle, startSettle] = useTransition();

  const isPickup = order.fulfillment_type === "pickup";
  // Cash du au vendeur : prix produit (le livreur garde les frais), uniquement
  // pour une livraison livree non refusee et non encore reglee.
  const owesVendor =
    !isPickup && order.status === "delivered" && !order.refused && !order.vendor_settled;

  function viewCni() {
    startCni(async () => {
      const res = await getDriverCni(order.id);
      if (res.url) window.open(res.url, "_blank", "noopener");
      else toast({ title: res.error ?? "Erreur", variant: "error" });
    });
  }

  function settle() {
    startSettle(async () => {
      const res = await markVendorSettled(order.id);
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Cash confirme recu", variant: "success" });
    });
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{order.code}</span>
            <OrderStatusBadge status={order.status} />
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
              {isPickup ? "Retrait" : "Livraison"}
            </span>
            {order.vendor_settled && <Badge variant="success">Cash recu</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <p className="whitespace-nowrap font-bold">{formatFcfa(order.total)}</p>
      </div>

      {/* Articles avec images */}
      <OrderItemsList items={order.order_items} />

      {/* Client */}
      <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-2.5 text-sm">
        <span className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="font-medium">{order.client?.full_name}</span>
        </span>
        {order.client?.phone && (
          <a href={`tel:${order.client.phone}`} className="flex items-center gap-1 font-medium text-accent">
            <Phone className="size-4" /> {order.client.phone}
          </a>
        )}
      </div>

      {/* Identite du livreur (verification avant remise) */}
      {order.driver && (
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Livreur a verifier
          </p>
          <div className="flex items-center gap-3">
            {order.driver.avatar_url ? (
              <Image
                src={order.driver.avatar_url}
                alt={order.driver.full_name}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initials(order.driver.full_name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{order.driver.full_name}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {order.driver.vehicle_type && (
                  <span className="flex items-center gap-1"><Bike className="size-3" />{order.driver.vehicle_type}</span>
                )}
                {order.driver.phone && (
                  <a href={`tel:${order.driver.phone}`} className="flex items-center gap-1 text-accent">
                    <Phone className="size-3" />{order.driver.phone}
                  </a>
                )}
              </p>
            </div>
            {order.driver.has_cni && (
              <Button size="sm" variant="outline" onClick={viewCni} disabled={pendingCni}>
                {pendingCni ? <Loader2 className="size-4 animate-spin" /> : <IdCard className="size-4" />}
                Voir CNI
              </Button>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="size-3" /> Comparez la photo et la CNI avant de remettre le colis.
          </p>
        </div>
      )}

      {/* Cash a recevoir du livreur */}
      {owesVendor && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-amber-800">
            <Wallet className="size-4" /> Le livreur vous doit{" "}
            <strong>{formatFcfa(order.subtotal)}</strong> (cash).
          </p>
          <Button size="sm" onClick={settle} disabled={pendingSettle}>
            {pendingSettle && <Loader2 className="size-4 animate-spin" />} Argent recu
          </Button>
        </div>
      )}

      {/* Transitions de statut */}
      <OrderManage orderId={order.id} status={order.status} fulfillment={order.fulfillment_type} />
    </div>
  );
}

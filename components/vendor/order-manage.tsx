"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/orders";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { OrderStatus, FulfillmentType } from "@/lib/database.types";

type Step = { status: OrderStatus; label: string; danger?: boolean };

/** Transitions cote vendeur, selon le mode de reception. */
function nextSteps(status: OrderStatus, fulfillment: FulfillmentType): Step[] {
  if (status === "pending")
    return [
      { status: "confirmed", label: "Accepter" },
      { status: "refused", label: "Refuser", danger: true },
    ];
  if (status === "confirmed")
    return [{ status: "preparing", label: "Mettre en preparation" }];
  if (status === "preparing") {
    return fulfillment === "pickup"
      ? [{ status: "delivered", label: "Remettre au client (retire)" }]
      : [{ status: "delivering", label: "Confier au livreur" }];
  }
  return [];
}

export function OrderManage({
  orderId,
  status,
  fulfillment = "delivery",
}: {
  orderId: string;
  status: OrderStatus;
  fulfillment?: FulfillmentType;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const actions = nextSteps(status, fulfillment);

  if (actions.length === 0) return null;

  function go(next: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next);
      if (res.error) toast({ title: res.error, variant: "error" });
      else toast({ title: "Statut mis a jour", variant: "success" });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.danger ? "destructive" : "default"}
          disabled={pending}
          onClick={() => go(a.status)}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {a.label}
        </Button>
      ))}
    </div>
  );
}

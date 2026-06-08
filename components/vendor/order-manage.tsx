"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/orders";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/database.types";

/** Transitions autorisees cote vendeur. */
const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }[]>> = {
  pending: [
    { status: "confirmed", label: "Accepter" },
    { status: "refused", label: "Refuser" },
  ],
  confirmed: [{ status: "preparing", label: "Mettre en preparation" }],
  preparing: [{ status: "delivering", label: "Confier au livreur" }],
};

export function OrderManage({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const actions = NEXT[status];

  if (!actions) return null;

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
          variant={a.status === "refused" ? "destructive" : "default"}
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

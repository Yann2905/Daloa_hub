import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/database.types";

const VARIANT: Record<OrderStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "warning",
  confirmed: "secondary",
  preparing: "secondary",
  delivering: "accent",
  delivered: "success",
  refused: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

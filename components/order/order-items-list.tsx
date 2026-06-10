import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatFcfa } from "@/lib/utils";

export interface OrderItemView {
  id: string;
  name: string;
  quantity: number;
  unit_price?: number;
  image_url?: string | null;
  variant?: string | null;
}

export function OrderItemsList({ items }: { items: OrderItemView[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 p-2.5">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-secondary">
            {it.image_url ? (
              <Image src={it.image_url} alt={it.name} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{it.name}</p>
            {it.variant && <p className="truncate text-xs font-medium text-primary">{it.variant}</p>}
            <p className="text-xs text-muted-foreground">
              Quantite : {it.quantity}
              {it.unit_price != null && ` - ${formatFcfa(it.unit_price)} / unite`}
            </p>
          </div>
          {it.unit_price != null && (
            <span className="whitespace-nowrap text-sm font-semibold">
              {formatFcfa(it.unit_price * it.quantity)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

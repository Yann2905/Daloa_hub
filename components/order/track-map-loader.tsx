"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TrackMap = dynamic(() => import("./track-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-xl border bg-secondary">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function TrackMapLoader({
  orderId,
  dest,
}: {
  orderId: string;
  dest: { lat: number; lng: number };
}) {
  return <TrackMap orderId={orderId} dest={dest} />;
}

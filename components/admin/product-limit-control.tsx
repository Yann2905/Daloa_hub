"use client";

import { useState, useTransition } from "react";
import { Package, Loader2 } from "lucide-react";
import { setVendorProductLimit } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductLimitControl({
  vendorId,
  limit,
}: {
  vendorId: string;
  limit: number;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState(String(limit));
  const [pending, start] = useTransition();

  function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return toast({ title: "Nombre invalide", variant: "error" });
    start(async () => {
      const res = await setVendorProductLimit(vendorId, n);
      toast(
        res.error
          ? { title: res.error, variant: "error" }
          : { title: `Limite definie a ${n} produits`, variant: "success" },
      );
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Package className="size-4 text-muted-foreground" />
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-20"
        aria-label="Limite de produits"
      />
      <Button size="sm" variant="secondary" onClick={save} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Definir"}
      </Button>
    </div>
  );
}

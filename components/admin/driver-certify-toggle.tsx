"use client";

import { useTransition } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { setDriverVerified } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function DriverCertifyToggle({ driverId, verified }: { driverId: string; verified: boolean }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await setDriverVerified(driverId, !verified);
      toast(
        res.error
          ? { title: res.error, variant: "error" }
          : { title: !verified ? "Livreur certifie" : "Certification retiree", variant: "success" },
      );
    });
  }

  return (
    <Button size="sm" variant={verified ? "outline" : "secondary"} onClick={toggle} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
      {verified ? "Retirer le badge" : "Certifier"}
    </Button>
  );
}

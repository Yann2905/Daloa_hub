"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { renewSubscription } from "@/lib/actions/vendor";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function RenewSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function renew() {
    startTransition(async () => {
      const res = await renewSubscription();
      if (res.error) toast({ title: res.error, variant: "error" });
      else {
        toast({ title: "Abonnement active", variant: "success" });
        router.refresh();
      }
    });
  }

  return (
    <Button onClick={renew} disabled={pending} size="lg">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
      Payer 1000 FCFA / mois
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { openConversation } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function NegotiateButton({
  vendorId,
  productId,
  productName,
  price,
  label = "Negocier le prix",
}: {
  vendorId: string;
  productId?: string;
  productName?: string;
  price?: number;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  function go() {
    start(async () => {
      const starter = productName
        ? `Bonjour, je suis interesse par "${productName}"${price != null ? ` (${formatFcfa(price)})` : ""}. Peut-on discuter du prix ?`
        : undefined;
      const res = await openConversation({ vendorId, productId, starter });
      if (res.error) return toast({ title: res.error, variant: "error" });
      router.push(`/messages/${res.id}`);
    });
  }

  return (
    <Button variant="royal" onClick={go} disabled={pending} size="lg" className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
      {label}
    </Button>
  );
}

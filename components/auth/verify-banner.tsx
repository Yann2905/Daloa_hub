"use client";

import { useTransition, useState } from "react";
import { MailWarning, Loader2 } from "lucide-react";
import { resendVerification } from "@/lib/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function VerifyBanner() {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  function resend() {
    start(async () => {
      const res = await resendVerification();
      if (res.error) return toast({ title: res.error, variant: "error" });
      setSent(true);
      toast({ title: "E-mail de verification envoye", variant: "success" });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-800">Confirmez votre adresse e-mail</p>
          <p className="text-sm text-amber-700">
            Verifiez votre boite mail pour securiser votre compte.
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={resend} disabled={pending || sent} className="shrink-0">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {sent ? "E-mail envoye" : "Renvoyer le lien"}
      </Button>
    </div>
  );
}

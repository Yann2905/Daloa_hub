"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, MailCheck } from "lucide-react";
import { requestPasswordReset, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Verifiez votre boite mail</h1>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec cette adresse, vous recevrez un lien pour
          reinitialiser votre mot de passe (valable 1 heure).
        </p>
        <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
          Retour a la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublie</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre e-mail, nous vous enverrons un lien de reinitialisation.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" className="pl-10" required />
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <SubmitButton className="w-full" size="lg">Envoyer le lien</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">Retour a la connexion</Link>
      </p>
    </form>
  );
}

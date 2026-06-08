"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accedez a votre compte DALOA HUB.
        </p>
      </div>

      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton className="w-full" size="lg">
        Se connecter
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand-green">
          Creer un compte
        </Link>
      </p>
    </form>
  );
}

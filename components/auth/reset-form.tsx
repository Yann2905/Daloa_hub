"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { resetPassword, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(resetPassword, {});
  const [showPwd, setShowPwd] = useState(false);

  if (!token) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-bold">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">
          Le lien de reinitialisation est incomplet ou a expire.
        </p>
        <Link href="/mot-de-passe-oublie" className="inline-block text-sm font-semibold text-primary hover:underline">
          Refaire une demande
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe securise.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="6 caracteres minimum"
            className="px-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={showPwd ? "Masquer" : "Afficher"}
          >
            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <SubmitButton className="w-full" size="lg">Reinitialiser le mot de passe</SubmitButton>
    </form>
  );
}

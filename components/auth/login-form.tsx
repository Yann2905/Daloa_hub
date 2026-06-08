"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signIn, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(signIn, {});
  const [showPwd, setShowPwd] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Bon retour</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous a votre compte DALOA HUB.
        </p>
      </div>

      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="px-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPwd ? "Masquer" : "Afficher"}
          >
            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton className="w-full" size="lg">
        Se connecter
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primary hover:underline">
          Creer un compte
        </Link>
      </p>
    </form>
  );
}

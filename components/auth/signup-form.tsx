"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { UserRole } from "@/lib/database.types";

const ROLE_LABELS: Record<string, string> = {
  client: "Client (acheter)",
  vendor: "Vendeur (vendre)",
  driver: "Livreur (livrer)",
};

export function SignupForm({ defaultRole = "client" }: { defaultRole?: UserRole }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(signUp, {});
  const [role, setRole] = useState<string>(defaultRole);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Creer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez la marketplace de Daloa.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Je m&apos;inscris en tant que</Label>
        <Select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <Input id="full_name" name="full_name" required />
      </div>

      {role === "vendor" && (
        <div className="space-y-2">
          <Label htmlFor="shop_name">Nom de la boutique</Label>
          <Input id="shop_name" name="shop_name" required />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone">Telephone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="07 00 00 00 00" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>

      {role === "driver" && (
        <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          Apres inscription, vous devrez televerser votre CNI et le document du
          vehicule. Un livreur non valide ne peut pas encore travailler.
        </p>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton className="w-full" size="lg">
        Creer mon compte
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Deja inscrit ?{" "}
        <Link href="/login" className="font-medium text-brand-green">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

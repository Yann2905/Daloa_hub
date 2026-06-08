"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  Store,
  ShoppingBag,
  Truck,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { signUp, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/database.types";

const ROLES = [
  { value: "client", label: "Client", desc: "Acheter", icon: ShoppingBag },
  { value: "vendor", label: "Vendeur", desc: "Vendre", icon: Store },
  { value: "driver", label: "Livreur", desc: "Livrer", icon: Truck },
] as const;

export function SignupForm({ defaultRole = "client" }: { defaultRole?: UserRole }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(signUp, {});
  const [role, setRole] = useState<string>(defaultRole);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Creer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez la marketplace de Daloa en 1 minute.
        </p>
      </div>

      {/* Selecteur de role visuel */}
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = role === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all duration-200 active:scale-95",
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-primary/40",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className={cn("text-sm font-semibold", active && "text-primary")}>
                {r.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{r.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="full_name" name="full_name" className="pl-10" placeholder="Awa Kone" required />
        </div>
      </div>

      {role === "vendor" && (
        <div className="space-y-2 animate-in">
          <Label htmlFor="shop_name">Nom de la boutique</Label>
          <div className="relative">
            <Store className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="shop_name" name="shop_name" className="pl-10" placeholder="Boutique Kone" required />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Telephone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" name="phone" type="tel" className="pl-10" placeholder="07 00 00 00 00" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" autoComplete="email" className="pl-10" placeholder="vous@exemple.com" required />
          </div>
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
            autoComplete="new-password"
            className="px-10"
            placeholder="6 caracteres minimum"
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

      {role === "driver" && (
        <p className="rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground animate-in">
          Apres inscription, televersez votre CNI et le document du vehicule. Un
          livreur non valide ne peut pas encore travailler.
        </p>
      )}

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton className="w-full" size="lg">
        Creer mon compte
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Deja inscrit ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

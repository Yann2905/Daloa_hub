"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteUser } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  function remove() {
    start(async () => {
      const res = await deleteUser(userId);
      if (res.error) {
        toast({ title: res.error, variant: "error" });
        setConfirming(false);
        return;
      }
      toast({ title: "Compte supprime definitivement", variant: "success" });
      router.push("/admin/utilisateurs");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" /> Supprimer le compte
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
      <p className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="size-4" /> Supprimer <strong>{name}</strong> et TOUTES ses donnees
        (commandes, boutique, messages...) ? Action irreversible.
      </p>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={remove} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Oui, supprimer definitivement
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

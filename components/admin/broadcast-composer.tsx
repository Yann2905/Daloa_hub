"use client";

import { useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { broadcastToUsers } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function BroadcastComposer() {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!body.trim()) return;
    if (!confirm("Envoyer cette annonce a TOUS les utilisateurs ?")) return;
    setBusy(true);
    const res = await broadcastToUsers(body);
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    setBody("");
    toast({ title: `Annonce envoyee a ${res.sent} utilisateur(s)`, variant: "success" });
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
      <h2 className="flex items-center gap-2 font-semibold">
        <Megaphone className="size-5 text-accent" /> Annonce a tous les utilisateurs
      </h2>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Votre message (apparaitra dans la messagerie de chacun, signe Equipe de DALOA HUB)..."
      />
      <Button onClick={send} disabled={busy || !body.trim()}>
        {busy && <Loader2 className="size-4 animate-spin" />} Envoyer a tous
      </Button>
    </div>
  );
}

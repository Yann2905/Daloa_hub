"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, Send } from "lucide-react";
import { registerPush, getDeviceToken, isPushConfigured } from "@/lib/firebase-client";
import { sendTestPushToToken } from "@/lib/actions/push";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function EnablePushButton() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [show, setShow] = useState(false);

  async function test() {
    setTesting(true);
    const token = await getDeviceToken();
    if (!token) {
      setTesting(false);
      toast({ title: "Cliquez d'abord sur Activer", description: "Autorisez les notifications, puis re-testez.", variant: "error" });
      return;
    }
    const r = await sendTestPushToToken(token);
    setTesting(false);
    if (r.ok) {
      toast({ title: "Notification envoyee", description: "Elle doit apparaitre dans 1-2 s sur cet appareil.", variant: "success" });
    } else {
      toast({ title: "Echec d'envoi", description: r.error ?? "Reessayez.", variant: "error" });
    }
  }

  useEffect(() => {
    if (!isPushConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setShow(true);
    setGranted(Notification.permission === "granted");
  }, []);

  if (!show) return null;

  async function enable() {
    setBusy(true);
    const res = await registerPush();
    setBusy(false);
    if (res === "ok") {
      setGranted(true);
      toast({ title: "Notifications activees", variant: "success" });
    } else if (res === "denied") {
      toast({
        title: "Notifications bloquees",
        description:
          "Autorisez les notifications pour ce site (cadenas a cote de l'adresse). Sur iPhone : ajoutez d'abord le site a l'ecran d'accueil.",
        variant: "error",
      });
    } else if (res === "unsupported") {
      toast({
        title: "Non supporte ici",
        description: "Ouvrez le site dans Chrome/Safari (sur iPhone, ajoute a l'ecran d'accueil).",
        variant: "error",
      });
    } else {
      toast({ title: "Echec de l'activation", variant: "error" });
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {granted ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        </span>
        <div>
          <p className="font-medium">Notifications push</p>
          <p className="text-xs text-muted-foreground">
            {granted ? "Activees sur cet appareil." : "Soyez alerte des commandes et messages."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button onClick={enable} disabled={busy} variant={granted ? "outline" : "royal"} size="sm">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {granted ? "Reactiver" : "Activer"}
        </Button>
        {granted && (
          <Button onClick={test} disabled={testing} variant="secondary" size="sm">
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Tester
          </Button>
        )}
      </div>
    </div>
  );
}

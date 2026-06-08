"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, Send, EyeOff } from "lucide-react";
import {
  setDriverStatus,
  setVendorStatus,
  setAccountStatus,
  resolveReport,
  changeUserRole,
  notifyUser,
  setProductActiveAdmin,
  signDocument,
} from "@/lib/actions/admin";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DriverValidation({ driverId, status }: { driverId: string; status: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  function act(s: "approved" | "rejected") {
    start(async () => {
      const res = await setDriverStatus(driverId, s);
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Mis a jour", variant: "success" });
    });
  }
  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button size="sm" disabled={pending} onClick={() => act("approved")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Valider
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("rejected")}>
          Rejeter
        </Button>
      )}
    </div>
  );
}

export function VendorValidation({ vendorId, status }: { vendorId: string; status: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  function act(s: "approved" | "rejected") {
    start(async () => {
      const res = await setVendorStatus(vendorId, s);
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Mis a jour", variant: "success" });
    });
  }
  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button size="sm" disabled={pending} onClick={() => act("approved")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Valider
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("rejected")}>
          Rejeter
        </Button>
      )}
    </div>
  );
}

export function AccountToggle({ userId, status }: { userId: string; status: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const suspended = status === "suspended";
  function act() {
    start(async () => {
      const res = await setAccountStatus(userId, suspended ? "active" : "suspended");
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Mis a jour", variant: "success" });
    });
  }
  return (
    <Button size="sm" variant={suspended ? "default" : "destructive"} disabled={pending} onClick={act}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {suspended ? "Reactiver" : "Suspendre"}
    </Button>
  );
}

export function ReportResolve({ reportId, status }: { reportId: string; status: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  function act(s: "resolved" | "dismissed") {
    start(async () => {
      const res = await resolveReport(reportId, s);
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Mis a jour", variant: "success" });
    });
  }
  if (status === "resolved" || status === "dismissed") return null;
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => act("resolved")}>
        {pending && <Loader2 className="size-4 animate-spin" />} Resoudre
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => act("dismissed")}>
        Rejeter
      </Button>
    </div>
  );
}

export function ViewDocument({ path, label }: { path: string | null; label: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  if (!path) return <span className="text-xs text-muted-foreground">{label} : absent</span>;
  function open() {
    start(async () => {
      const res = await signDocument(path!);
      if (res.url) window.open(res.url, "_blank", "noopener");
      else toast({ title: res.error ?? "Erreur", variant: "error" });
    });
  }
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={open}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} {label}
    </Button>
  );
}

export function RoleChanger({ userId, role }: { userId: string; role: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role);

  function apply() {
    if (value === role) return;
    start(async () => {
      const res = await changeUserRole(userId, value as "client" | "vendor" | "driver" | "admin");
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Role mis a jour", variant: "success" });
    });
  }
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onChange={(e) => setValue(e.target.value)} className="h-9 w-36">
        <option value="client">Client</option>
        <option value="vendor">Vendeur</option>
        <option value="driver">Livreur</option>
        <option value="admin">Admin</option>
      </Select>
      <Button size="sm" disabled={pending || value === role} onClick={apply}>
        {pending && <Loader2 className="size-4 animate-spin" />} Appliquer
      </Button>
    </div>
  );
}

export function NotifyUser({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function send() {
    start(async () => {
      const res = await notifyUser(userId, title, body);
      if (res.error) return toast({ title: res.error, variant: "error" });
      toast({ title: "Message envoye (notification + email)", variant: "success" });
      setTitle("");
      setBody("");
      setOpen(false);
    });
  }

  if (!open)
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send className="size-4" /> Envoyer un message
      </Button>
    );

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Votre message..." value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={send}>
          {pending && <Loader2 className="size-4 animate-spin" />} Envoyer
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      </div>
    </div>
  );
}

export function ProductActiveToggle({ id, active }: { id: string; active: boolean }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  function toggle() {
    start(async () => {
      const res = await setProductActiveAdmin(id, !active);
      toast(res.error ? { title: res.error, variant: "error" } : { title: "Mis a jour", variant: "success" });
    });
  }
  return (
    <Button size="sm" variant={active ? "outline" : "default"} disabled={pending} onClick={toggle}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      {active ? "Masquer" : "Afficher"}
    </Button>
  );
}

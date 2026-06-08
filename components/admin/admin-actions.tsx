"use client";

import { useTransition } from "react";
import { Loader2, Eye } from "lucide-react";
import {
  setDriverStatus,
  setVendorStatus,
  setAccountStatus,
  resolveReport,
} from "@/lib/actions/admin";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

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
  if (!path) return <span className="text-xs text-muted-foreground">{label} : absent</span>;
  return (
    <Button asChild size="sm" variant="outline">
      <a href={path} target="_blank" rel="noopener noreferrer">
        <Eye className="size-4" /> {label}
      </a>
    </Button>
  );
}

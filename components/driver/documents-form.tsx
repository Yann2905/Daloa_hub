"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { submitDocuments } from "@/lib/actions/driver";
import { useToast } from "@/components/ui/toast";
import { DocumentUploader } from "@/components/upload/document-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Driver } from "@/lib/database.types";

export function DocumentsForm({ driver }: { driver: Driver }) {
  const router = useRouter();
  const { toast } = useToast();
  const [cni, setCni] = useState<string | null>(driver.cni_url);
  const [vehicleDoc, setVehicleDoc] = useState<string | null>(driver.vehicle_doc_url);
  const [vehicleType, setVehicleType] = useState(driver.vehicle_type ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cni || !vehicleDoc) {
      toast({ title: "Televersez les deux documents", variant: "error" });
      return;
    }
    setBusy(true);
    const res = await submitDocuments({
      cni_url: cni,
      vehicle_doc_url: vehicleDoc,
      vehicle_type: vehicleType,
    });
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: "Documents soumis pour validation", variant: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <DocumentUploader label="Carte Nationale d'Identite (CNI)" value={cni} onChange={setCni} />
      <DocumentUploader label="Document du vehicule" value={vehicleDoc} onChange={setVehicleDoc} />
      <div className="space-y-2">
        <Label htmlFor="vehicle_type">Type de vehicule</Label>
        <Input
          id="vehicle_type"
          placeholder="Moto, tricycle, voiture..."
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Soumettre pour validation
      </Button>
    </form>
  );
}

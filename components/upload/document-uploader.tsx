"use client";

import { useState } from "react";
import { Loader2, Upload, FileCheck } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Televerse un document (CNI, document vehicule) vers Cloudinary et retourne
 * son URL securisee. L'administrateur l'ouvre directement pour verification.
 */
export function DocumentUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "daloa-hub/documents");
      onChange(url);
      toast({ title: "Document televerse", variant: "success" });
    } catch (e) {
      toast({
        title: "Echec du televersement",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 hover:border-brand-green",
        uploading && "pointer-events-none opacity-60",
      )}
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <FileCheck className="size-5 text-brand-green" />
      ) : (
        <Upload className="size-5 text-muted-foreground" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value ? "Document enregistre" : "JPG, PNG ou PDF"}
        </p>
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </label>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Upload, FileCheck } from "lucide-react";
import { getDocumentUploadParams } from "@/lib/actions/driver";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Televerse un document PRIVE (CNI, document vehicule) vers Cloudinary en mode
 * "authenticated" (jamais accessible publiquement) via un upload signe.
 * Stocke le public_id ; seul l'admin peut le consulter via une URL signee.
 */
export function DocumentUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (publicId: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const p = await getDocumentUploadParams();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", p.apiKey);
      form.append("timestamp", String(p.timestamp));
      form.append("signature", p.signature);
      form.append("folder", p.folder);
      form.append("type", p.type);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${p.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { public_id: string };
      onChange(data.public_id);
      toast({ title: "Document televerse (prive)", variant: "success" });
    } catch (e) {
      toast({
        title: "Echec du televersement",
        description: e instanceof Error ? e.message.slice(0, 120) : undefined,
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors hover:border-primary",
        uploading && "pointer-events-none opacity-60",
      )}
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <FileCheck className="size-5 text-primary" />
      ) : (
        <Upload className="size-5 text-muted-foreground" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value ? "Document enregistre (prive)" : "Photo JPG ou PNG"}
        </p>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </label>
  );
}

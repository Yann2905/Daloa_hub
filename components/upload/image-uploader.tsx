"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Televerse une ou plusieurs images vers Cloudinary (upload non signe) et
 * retourne les URLs securisees.
 */
export function ImageUploader({
  folder = "produits",
  value,
  onChange,
  max = 4,
  // bucket conserve pour compatibilite d'appel (ignore avec Cloudinary)
  bucket,
}: {
  folder?: string;
  bucket?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const dest = bucket ? `daloa-hub/${bucket}` : `daloa-hub/${folder}`;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const slots = Array.from(files).slice(0, max - value.length);
      const uploaded: string[] = [];
      for (const file of slots) {
        uploaded.push(await uploadToCloudinary(file, dest));
      }
      onChange([...value, ...uploaded]);
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
    <div className="grid grid-cols-4 gap-2">
      {value.map((url) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-md border">
          <Image src={url} alt="" fill sizes="120px" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            aria-label="Retirer"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <label
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:border-brand-green",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          Ajouter
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
}

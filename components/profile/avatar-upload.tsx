"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updateAvatar } from "@/lib/actions/profile";
import { useToast } from "@/components/ui/toast";
import { initials } from "@/lib/utils";

export function AvatarUpload({
  name,
  avatarUrl,
  required = false,
  size = 80,
}: {
  name: string;
  avatarUrl: string | null;
  required?: boolean;
  size?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [url, setUrl] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, "daloa-hub/avatars");
      const res = await updateAvatar(uploaded);
      if (res.error) throw new Error(res.error);
      setUrl(uploaded);
      toast({ title: "Photo de profil mise a jour", variant: "success" });
      router.refresh();
    } catch (e) {
      toast({
        title: "Echec",
        description: e instanceof Error ? e.message.slice(0, 100) : undefined,
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {url ? (
          <Image
            src={url}
            alt={name}
            fill
            sizes="80px"
            className="rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-full bg-brand-gradient font-bold text-white"
            style={{ width: size, height: size, fontSize: size / 3 }}
          >
            {initials(name)}
          </span>
        )}
        <label
          className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform active:scale-90"
          aria-label="Changer la photo"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <div>
        <p className="text-sm font-medium">Photo de profil</p>
        <p className="text-xs text-muted-foreground">
          {required && !url ? (
            <span className="text-destructive">Obligatoire pour les livreurs.</span>
          ) : (
            "Touchez l'icone camera pour changer."
          )}
        </p>
      </div>
    </div>
  );
}

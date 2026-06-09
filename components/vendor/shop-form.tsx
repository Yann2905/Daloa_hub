"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { updateShop } from "@/lib/actions/vendor";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/upload/image-uploader";
import type { Vendor } from "@/lib/database.types";

export function ShopForm({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const { toast } = useToast();
  const [shopName, setShopName] = useState(vendor.shop_name);
  const [description, setDescription] = useState(vendor.description ?? "");
  const [address, setAddress] = useState(vendor.address ?? "");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: vendor.lat,
    lng: vendor.lng,
  });
  const [logo, setLogo] = useState<string[]>(vendor.logo_url ? [vendor.logo_url] : []);
  const [deliversSelf, setDeliversSelf] = useState(vendor.delivers_self ?? false);
  const [selfFee, setSelfFee] = useState(
    vendor.self_delivery_fee != null ? String(vendor.self_delivery_fee) : "",
  );
  const [busy, setBusy] = useState(false);

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({ title: "Position de la boutique enregistree", variant: "success" });
      },
      () => toast({ title: "Localisation refusee", variant: "error" }),
      { enableHighAccuracy: true },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await updateShop({
      shop_name: shopName,
      description,
      address,
      lat: coords.lat ?? undefined,
      lng: coords.lng ?? undefined,
      logo_url: logo[0] ?? "",
      delivers_self: deliversSelf,
      self_delivery_fee: deliversSelf && selfFee ? Number(selfFee) : undefined,
    });
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    toast({ title: "Boutique mise a jour", variant: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Logo</Label>
        <ImageUploader bucket="shops" value={logo} onChange={setLogo} max={1} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shop_name">Nom de la boutique</Label>
        <Input id="shop_name" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse / quartier</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-secondary p-3">
        <p className="text-sm font-medium">Position de la boutique</p>
        <p className="text-xs text-muted-foreground">
          Indispensable pour calculer les frais de livraison.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={locate}>
            <MapPin className="size-4" /> Definir ma position
          </Button>
          {coords.lat != null && (
            <span className="text-xs text-muted-foreground">
              {coords.lat.toFixed(5)}, {coords.lng?.toFixed(5)}
            </span>
          )}
        </div>
      </div>

      {/* Livraison par le vendeur */}
      <div className="space-y-3 rounded-lg border bg-secondary p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={deliversSelf}
            onChange={(e) => setDeliversSelf(e.target.checked)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            <span className="text-sm font-medium">Je livre moi-meme (j&apos;ai une moto)</span>
            <span className="block text-xs text-muted-foreground">
              Les commandes en livraison vous seront confiees directement, sans livreur DALOA HUB.
              Vous encaissez le client vous-meme.
            </span>
          </span>
        </label>
        {deliversSelf && (
          <div className="space-y-2 pl-7">
            <Label htmlFor="self_fee">Vos frais de livraison (FCFA)</Label>
            <Input
              id="self_fee"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Ex : 500"
              value={selfFee}
              onChange={(e) => setSelfFee(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser le calcul automatique selon la distance.
            </p>
          </div>
        )}
      </div>

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Enregistrer
      </Button>
    </form>
  );
}

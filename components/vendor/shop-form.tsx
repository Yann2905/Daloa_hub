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

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Enregistrer
      </Button>
    </form>
  );
}

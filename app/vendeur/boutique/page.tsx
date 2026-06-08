import { getMyVendor } from "@/lib/queries/vendor";
import { ShopForm } from "@/components/vendor/shop-form";

export const metadata = { title: "Ma boutique" };

export default async function ShopSettingsPage() {
  const vendor = await getMyVendor();
  if (!vendor) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ma boutique</h1>
      <ShopForm vendor={vendor} />
    </div>
  );
}

import Link from "next/link";
import { Store, Truck, ShieldCheck, ClipboardList } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { initials } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const roleLinks: Record<string, { href: string; label: string; icon: typeof Store }> = {
    vendor: { href: "/vendeur", label: "Espace vendeur", icon: Store },
    driver: { href: "/livreur", label: "Espace livreur", icon: Truck },
    admin: { href: "/admin", label: "Administration", icon: ShieldCheck },
  };
  const roleLink = roleLinks[profile.role];

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-green text-xl font-bold text-white">
          {initials(profile.full_name)}
        </span>
        <div>
          <h1 className="text-xl font-bold">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground">{profile.phone}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <Link href="/commandes" className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-brand-green">
          <ClipboardList className="size-5 text-brand-green" />
          <span className="font-medium">Mes commandes</span>
        </Link>
        {roleLink && (
          <Link href={roleLink.href} className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-brand-green">
            <roleLink.icon className="size-5 text-brand-green" />
            <span className="font-medium">{roleLink.label}</span>
          </Link>
        )}
      </div>

      <LogoutButton className="w-full" />
    </div>
  );
}

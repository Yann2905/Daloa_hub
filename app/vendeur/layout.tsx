import { requireRole } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

const nav: NavItem[] = [
  { href: "/vendeur", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/vendeur/produits", label: "Produits", icon: "Package" },
  { href: "/vendeur/commandes", label: "Commandes", icon: "ShoppingBag" },
  { href: "/vendeur/boutique", label: "Ma boutique", icon: "Store" },
  { href: "/vendeur/abonnement", label: "Abonnement", icon: "CreditCard" },
];

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("vendor");
  return (
    <DashboardShell nav={nav} title="Espace vendeur">
      {children}
    </DashboardShell>
  );
}

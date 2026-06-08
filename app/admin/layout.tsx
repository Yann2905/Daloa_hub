import { requireRole } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

const nav: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "Users" },
  { href: "/admin/livreurs", label: "Livreurs", icon: "Truck" },
  { href: "/admin/vendeurs", label: "Vendeurs", icon: "Store" },
  { href: "/admin/signalements", label: "Signalements", icon: "Flag" },
  { href: "/admin/abonnements", label: "Abonnements", icon: "CreditCard" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <DashboardShell nav={nav} title="Administration">
      {children}
    </DashboardShell>
  );
}

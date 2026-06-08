import { requireRole } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

const nav: NavItem[] = [
  { href: "/livreur", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/livreur/livraisons", label: "Livraisons", icon: "Truck" },
  { href: "/livreur/documents", label: "Mes documents", icon: "FileText" },
];

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("driver");
  return (
    <DashboardShell nav={nav} title="Espace livreur">
      {children}
    </DashboardShell>
  );
}

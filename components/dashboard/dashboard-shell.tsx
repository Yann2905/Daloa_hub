"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Truck,
  Store,
  Flag,
  CreditCard,
  Package,
  ShoppingBag,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

// Les composants d'icone (fonctions) ne peuvent pas etre passes d'un Server
// Component a ce Client Component. On passe donc un NOM d'icone (string) que
// l'on resout ici.
const ICONS = {
  LayoutDashboard,
  Users,
  Truck,
  Store,
  Flag,
  CreditCard,
  Package,
  ShoppingBag,
  FileText,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

export function DashboardShell({
  nav,
  title,
  children,
}: {
  nav: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SideNav = (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-green text-white"
                : "text-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-secondary">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white p-4 md:flex">
        <div className="mb-6">
          <Logo />
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-green">
            {title}
          </p>
        </div>
        {SideNav}
        <div className="mt-auto pt-4">
          <LogoutButton className="w-full" />
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            {SideNav}
            <div className="mt-auto pt-4">
              <LogoutButton className="w-full" />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="md:hidden">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold md:hidden">{title}</span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

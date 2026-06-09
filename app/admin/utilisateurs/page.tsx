import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listUsers } from "@/lib/queries/admin";
import { formatDate, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/admin-search";
import { Pagination } from "@/components/ui/pagination";
import type { Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Utilisateurs" };
const PAGE_SIZE = 25;

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendor: "Vendeur",
  driver: "Livreur",
  admin: "Admin",
};
const ROLE_FILTERS = [
  { value: "", label: "Tous" },
  { value: "client", label: "Clients" },
  { value: "vendor", label: "Vendeurs" },
  { value: "driver", label: "Livreurs" },
  { value: "admin", label: "Admins" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const { role, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  let users: Profile[] = [];
  let total = 0;
  try {
    const res = await listUsers({ role, q, page, pageSize: PAGE_SIZE });
    users = res.users;
    total = res.total;
  } catch {
    users = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <AdminSearch placeholder="Nom, email, telephone..." />
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((f) => {
          const active = (role ?? "") === f.value;
          const sp = new URLSearchParams();
          if (f.value) sp.set("role", f.value);
          if (q) sp.set("q", q);
          return (
            <Link
              key={f.value}
              href={`/admin/utilisateurs?${sp.toString()}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-white" : "hover:border-primary/40"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/admin/utilisateurs/${u.id}`}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials(u.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.full_name}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              Inscrit le {formatDate(u.created_at)}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
              {u.account_status === "suspended" && <Badge variant="destructive">Suspendu</Badge>}
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ))}
        {users.length === 0 && (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Aucun utilisateur trouve.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} />
    </div>
  );
}

import { listUsers } from "@/lib/queries/admin";
import { formatDate, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AccountToggle } from "@/components/admin/admin-actions";
import type { Profile } from "@/lib/database.types";

export const metadata = { title: "Utilisateurs" };

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendor: "Vendeur",
  driver: "Livreur",
  admin: "Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  let users: Profile[] = [];
  try {
    users = await listUsers(role);
  } catch {
    users = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
              {initials(u.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.full_name}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              <p className="text-xs text-muted-foreground">Inscrit le {formatDate(u.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1">
                <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                {u.account_status === "suspended" && <Badge variant="destructive">Suspendu</Badge>}
              </div>
              {u.role !== "admin" && <AccountToggle userId={u.id} status={u.account_status} />}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucun utilisateur (ou configuration Supabase manquante).
          </p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Headset, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listSupportThreads } from "@/lib/queries/chat";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service client" };

export default async function AdminSupportPage() {
  await requireRole("admin");
  const threads = await listSupportThreads();

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={15} />
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Headset className="size-6 text-primary" /> Service client
      </h1>

      <BroadcastComposer />

      <div className="space-y-2">
        <h2 className="font-semibold">Conversations ({threads.length})</h2>
        {threads.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Aucune conversation de service client pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft transition hover:border-primary/40"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-orange text-white">
                    <Headset className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.client_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{t.last_body}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(t.last_message_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {t.needs_human && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="size-3" /> A traiter
                      </Badge>
                    )}
                    {t.unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

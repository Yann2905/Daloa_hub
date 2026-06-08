"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/database.types";

/**
 * Cloche de notifications par polling (toutes les 20 s) contre /api/notifications.
 * Remplace l'abonnement temps reel ; suffisant et robuste sur connexion lente.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Notification[] };
      setItems(data.items ?? []);
    } catch {
      /* hors ligne : on ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const unread = items.filter((i) => !i.is_read).length;

  async function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markAllRead();
        }}
        className="relative rounded-md p-2 hover:bg-secondary"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-lg border bg-card shadow-lg">
            <div className="border-b p-3 text-sm font-semibold">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Aucune notification.
                </p>
              ) : (
                items.map((n) => (
                  <div key={n.id} className="border-b p-3 last:border-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessagesSquare, Headset } from "lucide-react";
import { initials, cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { ConversationRow } from "@/lib/queries/chat";

export function ConversationList({ conversations }: { conversations: ConversationRow[] }) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <MessagesSquare className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Aucune conversation.</p>
        <Link href="/produits" className="text-sm font-semibold text-primary hover:underline">
          Parcourir les produits
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {conversations.map((c) => {
        const active = pathname === `/messages/${c.id}`;
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={cn(
                "flex items-center gap-3 p-3 transition-colors",
                active ? "bg-primary/10" : "bg-card hover:bg-secondary/60",
              )}
            >
              {c.is_support ? (
                <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-orange text-white">
                  <Headset className="size-5" />
                </span>
              ) : c.other_avatar ? (
                <Image src={c.other_avatar} alt={c.other_name} width={48} height={48} className="size-12 rounded-full object-cover" />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {initials(c.other_name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-medium">
                  {c.other_name}
                  {c.is_support && <VerifiedBadge />}
                </p>
                <p className="truncate text-sm text-muted-foreground">{c.last_body ?? "Nouvelle conversation"}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {c.unread}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

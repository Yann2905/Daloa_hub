import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { listMyConversations } from "@/lib/queries/chat";
import { initials } from "@/lib/utils";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const conversations = await listMyConversations();

  return (
    <div className="flex min-h-dvh flex-col">
      <AutoRefresh seconds={10} />
      <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 safe-top">
        <Link href="/" className="rounded-md p-1 hover:bg-secondary" aria-label="Retour">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Messages</h1>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <MessagesSquare className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune conversation pour le moment.</p>
          <Link href="/produits" className="text-sm font-semibold text-primary hover:underline">
            Parcourir les produits
          </Link>
        </div>
      ) : (
        <ul className="divide-y">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 bg-card p-3 transition-colors hover:bg-secondary/60">
                {c.other_avatar ? (
                  <Image src={c.other_avatar} alt={c.other_name} width={48} height={48} className="size-12 rounded-full object-cover" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {initials(c.other_name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.other_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.last_body ?? "Nouvelle conversation"}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { listMyConversations } from "@/lib/queries/chat";
import { ConversationList } from "@/components/chat/conversation-list";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const conversations = await listMyConversations();

  return (
    <>
      {/* Mobile : liste plein ecran */}
      <div className="flex h-full min-h-0 flex-col lg:hidden">
        <AutoRefresh seconds={12} />
        <header className="glass flex h-14 items-center gap-3 border-b px-4 safe-top">
          <Link href="/" className="rounded-md p-1 hover:bg-secondary" aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold">Messages</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} />
        </div>
      </div>

      {/* Desktop : invite a choisir (la liste est dans le panneau gauche) */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground lg:flex">
        <MessagesSquare className="size-12" />
        <p>Selectionnez une conversation pour commencer.</p>
      </div>
    </>
  );
}

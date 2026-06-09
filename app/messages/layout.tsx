import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMyConversations } from "@/lib/queries/chat";
import { PushRegister } from "@/components/push/push-register";
import { ConversationList } from "@/components/chat/conversation-list";
import { AutoRefresh } from "@/components/util/auto-refresh";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const conversations = await listMyConversations();

  return (
    <div className="flex h-dvh w-full bg-secondary">
      <PushRegister />
      {/* Liste (panneau gauche) : visible sur desktop uniquement */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Link href="/" className="rounded-md p-1 hover:bg-secondary" aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} />
        </div>
        <AutoRefresh seconds={12} />
      </aside>

      {/* Contenu (panneau droit) : liste sur mobile, fil de discussion */}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

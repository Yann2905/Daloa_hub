import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Headset } from "lucide-react";
import {
  getParticipation,
  listMessages,
  getConversationHeader,
} from "@/lib/queries/chat";
import { sql } from "@/lib/db";
import { initials } from "@/lib/utils";
import { ChatThread } from "@/components/chat/chat-thread";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = await getParticipation(id);
  if (!part) notFound();

  // Marque immediatement les messages recus comme lus (efface le compteur)
  if (part.isSupport) {
    await sql`update messages set read_at = now() where conversation_id = ${id}
      and read_at is null and from_team = ${part.isClient}`;
  } else {
    await sql`update messages set read_at = now() where conversation_id = ${id}
      and sender_id <> ${part.userId} and read_at is null`;
  }

  const [messages, header] = await Promise.all([
    listMessages(id),
    getConversationHeader(id),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-3 safe-top">
        <Link href="/messages" className="rounded-md p-1 hover:bg-secondary lg:hidden" aria-label="Retour">
          <ArrowLeft className="size-5" />
        </Link>
        {header?.is_support ? (
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-orange text-white">
            <Headset className="size-4" />
          </span>
        ) : header?.other_avatar ? (
          <Image src={header.other_avatar} alt={header.other_name} width={36} height={36} className="size-9 rounded-full object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {initials(header?.other_name ?? "?")}
          </span>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate font-semibold leading-tight">
            {header?.other_name}
            {header?.is_support && header?.is_client && <VerifiedBadge />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {header?.is_support ? "Service client - reponse rapide" : header?.shop_name}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-2">
        <ChatThread conversationId={id} me={part.userId} initialMessages={messages} />
      </div>
    </div>
  );
}

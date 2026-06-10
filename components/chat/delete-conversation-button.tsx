"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteConversation } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";

export function DeleteConversationButton({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm("Supprimer cette conversation ? Elle reapparaitra si vous recevez un nouveau message.")) return;
    start(async () => {
      const res = await deleteConversation(conversationId);
      if (res.error) return toast({ title: res.error, variant: "error" });
      toast({ title: "Conversation supprimee", variant: "success" });
      router.push("/messages");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label="Supprimer la conversation"
      className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
    </button>
  );
}

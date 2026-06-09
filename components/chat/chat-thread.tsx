"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function ChatThread({
  conversationId,
  me,
  initialMessages,
}: {
  conversationId: string;
  me: string;
  initialMessages: Msg[];
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Polling temps reel
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (active && Array.isArray(d.messages)) setMessages(d.messages);
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    setSending(true);
    // Affichage optimiste
    setMessages((m) => [
      ...m,
      { id: "tmp-" + Date.now(), sender_id: me, body: text, created_at: new Date().toISOString() },
    ]);
    const res = await sendMessage({ conversationId, body: text });
    setSending(false);
    if (res.error) toast({ title: res.error, variant: "error" });
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-1">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Demarrez la conversation. Proposez votre prix poliment.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-soft",
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-card",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                  {timeLabel(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t bg-card p-2 safe-bottom">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ecrivez votre message..."
          className="h-11 flex-1 rounded-full border-2 border-input bg-background px-4 text-base outline-none transition-colors focus:border-primary md:text-sm"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-90 disabled:opacity-50"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </form>
    </div>
  );
}

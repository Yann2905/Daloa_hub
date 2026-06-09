"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Check, CheckCheck } from "lucide-react";
import { sendMessage } from "@/lib/actions/chat";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
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
  const [otherOnline, setOtherOnline] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastIdRef = useRef<string | null>(initialMessages.at(-1)?.id ?? null);

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 680;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {
      /* audio indisponible */
    }
  }

  // Polling temps reel
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!active || !Array.isArray(d.messages)) return;
        setOtherOnline(!!d.otherOnline);
        const newest: Msg | undefined = d.messages.at(-1);
        // Son si un nouveau message recu (pas de moi)
        if (newest && newest.id !== lastIdRef.current && newest.sender_id !== me) beep();
        if (newest) lastIdRef.current = newest.id;
        setMessages(d.messages);
      } catch {
        /* ignore */
      }
    };
    load(); // immediat : marque les messages comme lus des l'ouverture
    const id = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [conversationId, me]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    setSending(true);
    const tmpId = "tmp-" + Date.now();
    setMessages((m) => [...m, { id: tmpId, sender_id: me, body: text, created_at: new Date().toISOString(), read_at: null }]);
    lastIdRef.current = tmpId;
    const res = await sendMessage({ conversationId, body: text });
    setSending(false);
    if (res.error) toast({ title: res.error, variant: "error" });
  }

  function Ticks({ m }: { m: Msg }) {
    if (m.id.startsWith("tmp-")) return <Check className="size-3.5 text-white/60" />;
    if (m.read_at) return <CheckCheck className="size-3.5 text-sky-300" />; // lu (bleu)
    if (otherOnline) return <CheckCheck className="size-3.5 text-white/60" />; // en ligne, non lu
    return <Check className="size-3.5 text-white/60" />; // non lu
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1 py-2">
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
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-soft",
                  mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <span className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                  {timeLabel(m.created_at)}
                  {mine && <Ticks m={m} />}
                </span>
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
          className="h-11 min-w-0 flex-1 rounded-full border-2 border-input bg-background px-4 text-base outline-none transition-colors focus:border-primary md:text-sm"
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

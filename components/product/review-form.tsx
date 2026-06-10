"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { addReview } from "@/lib/actions/reviews";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (stars < 1) return toast({ title: "Choisissez une note", variant: "error" });
    setBusy(true);
    const res = await addReview({ productId, stars, comment });
    setBusy(false);
    if (res.error) return toast({ title: res.error, variant: "error" });
    setDone(true);
    toast({ title: "Merci pour votre avis !", variant: "success" });
  }

  if (done) {
    return (
      <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
        Votre avis a ete publie. Merci !
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">Laissez votre avis</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} etoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "size-7 transition",
                (hover || stars) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Decrivez votre experience (optionnel)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Publier mon avis
      </Button>
    </form>
  );
}

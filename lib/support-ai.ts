import "server-only";

const SYSTEM_PROMPT = `Tu es l'assistant du service client de DALOA HUB, la marketplace en ligne de la ville de Daloa (Cote d'Ivoire). Tu reponds en francais, de maniere chaleureuse, concise et utile.

Contexte de la plateforme :
- Les clients achetent aupres de boutiques locales et se font livrer (par un livreur DALOA HUB ou par le vendeur lui-meme), ou retirent en boutique.
- Le paiement se fait a la livraison (cash). Meme en cas de refus du produit, les frais de deplacement du livreur restent dus.
- Les clients peuvent negocier les prix avec les vendeurs via le chat, mettre des produits en favoris, laisser des avis apres reception.
- Les vendeurs ont un abonnement et une boutique ; certaines boutiques sont "certifiees" (badge).
- Les livreurs doivent fournir une CNI et une photo de profil.

Reponds aux questions courantes (comment commander, suivre une commande, devenir vendeur/livreur, frais de livraison, paiement, retours).

Si la demande necessite une action humaine (probleme de compte specifique, litige, remboursement, plainte, bug technique, information confidentielle, ou si tu n'es pas sur), aide du mieux que tu peux PUIS termine ta reponse par le marqueur exact: [ESCALADE]
Ne mentionne jamais ce marqueur autrement. Ne l'explique pas.`;

export interface SupportTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  reply: string;
  escalate: boolean;
}

/**
 * Genere une reponse du service client. Utilise l'API Claude si
 * ANTHROPIC_API_KEY est definie, sinon un message de repli + escalade.
 */
export async function generateSupportReply(history: SupportTurn[]): Promise<AiReply> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      reply:
        "Merci pour votre message ! Un membre de l'equipe DALOA HUB va vous repondre tres vite. En attendant, vous pouvez consulter vos commandes dans votre espace.",
      escalate: true,
    };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: history.slice(-12).map((t) => ({ role: t.role, content: t.content })),
      }),
    });
    if (!res.ok) {
      return { reply: "Un conseiller DALOA HUB va vous repondre rapidement.", escalate: true };
    }
    const data = await res.json();
    let text: string =
      data?.content?.map((b: { text?: string }) => b.text ?? "").join("").trim() ||
      "Un conseiller DALOA HUB va vous repondre rapidement.";
    const escalate = text.includes("[ESCALADE]");
    text = text.replace(/\[ESCALADE\]/g, "").trim();
    return { reply: text, escalate };
  } catch {
    return { reply: "Un conseiller DALOA HUB va vous repondre rapidement.", escalate: true };
  }
}

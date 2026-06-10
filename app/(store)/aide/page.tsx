import Link from "next/link";
import { HelpCircle, ChevronDown, Phone } from "lucide-react";
import { SupportButton } from "@/components/chat/support-button";
import { SUPPORT_WHATSAPP, SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "@/lib/constants";

export const metadata = {
  title: "Aide & Assistance",
  description: "Centre d'aide DALOA HUB : commandes, paiement, livraison, retours, compte. Contactez le service client.",
};

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Commandes & suivi",
    items: [
      {
        q: "Comment passer une commande ?",
        a: "Ajoutez des produits au panier, puis validez en choisissant la livraison a domicile ou le retrait en boutique. Le paiement se fait a la livraison (cash).",
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Dans 'Mes commandes', vous voyez le statut. Pour une livraison, le livreur affecte et sa position en direct s'affichent sur la carte.",
      },
      {
        q: "Puis-je annuler / refuser ?",
        a: "Vous pouvez refuser le produit a la livraison, mais les frais de deplacement du livreur restent dus dans ce cas.",
      },
    ],
  },
  {
    title: "Paiement",
    items: [
      {
        q: "Comment je paie ?",
        a: "A la livraison, en especes. Vous reglez le livreur (ou le vendeur) au moment de recevoir votre commande.",
      },
      {
        q: "Y a-t-il des frais caches ?",
        a: "Non. Vous voyez le prix du produit et les frais de livraison avant de valider. Pas de surprise.",
      },
    ],
  },
  {
    title: "Livraison & retrait",
    items: [
      {
        q: "Qui livre ma commande ?",
        a: "Selon la boutique : un livreur DALOA HUB (le plus proche, affecte automatiquement) ou le vendeur lui-meme. Vous avez toujours son nom et son numero.",
      },
      {
        q: "Puis-je retirer en boutique ?",
        a: "Oui, choisissez 'Retrait en boutique' au moment de commander : c'est gratuit.",
      },
    ],
  },
  {
    title: "Vendre & livrer",
    items: [
      {
        q: "Comment devenir vendeur ?",
        a: "Cliquez sur 'Devenir vendeur', creez votre boutique et ajoutez vos produits. Apres validation par l'equipe, votre boutique devient visible.",
      },
      {
        q: "Comment devenir livreur ?",
        a: "Inscrivez-vous comme livreur, ajoutez votre photo de profil et votre CNI. Apres verification, vous recevez des livraisons.",
      },
    ],
  },
  {
    title: "Confiance & avis",
    items: [
      {
        q: "Que veut dire le badge bleu ?",
        a: "C'est une boutique certifiee par DALOA HUB : son identite a ete verifiee. Achetez en confiance.",
      },
      {
        q: "Comment negocier un prix ?",
        a: "Sur la fiche d'un produit, cliquez 'Negocier le prix' pour discuter directement avec le vendeur.",
      },
      {
        q: "Comment laisser un avis ?",
        a: "Apres avoir recu un produit, notez-le sur sa fiche (badge 'Achat verifie').",
      },
    ],
  },
];

export default function AidePage() {
  const waText = encodeURIComponent("Bonjour, j'ai besoin d'aide sur DALOA HUB.");

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-orange text-white">
          <HelpCircle className="size-7" />
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Aide & Assistance</h1>
        <p className="mt-1 text-muted-foreground">Une question ? On est la pour vous aider.</p>
      </div>

      {/* Canaux de contact */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SupportButton className="w-full" />
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${waText}`}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft transition hover:border-green-500/50 hover:shadow-card"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-green-500 text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.957zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </span>
          <span>
            <span className="block font-semibold">WhatsApp</span>
            <span className="block text-xs text-muted-foreground">Reponse rapide</span>
          </span>
        </a>
        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft transition hover:border-primary/50 hover:shadow-card"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-white">
            <Phone className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">Appeler</span>
            <span className="block text-xs text-muted-foreground">{SUPPORT_PHONE_DISPLAY}</span>
          </span>
        </a>
      </div>

      {/* FAQ par categories */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight">{section.title}</h2>
          {section.items.map((item) => (
            <details key={item.q} className="group rounded-xl border bg-card shadow-soft">
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 font-medium">
                {item.q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t p-4 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      ))}

      <p className="text-center text-sm text-muted-foreground">
        Voir aussi nos{" "}
        <Link href="/cgu" className="text-primary hover:underline">conditions</Link> et notre{" "}
        <Link href="/confidentialite" className="text-primary hover:underline">politique de confidentialite</Link>.
      </p>
    </div>
  );
}

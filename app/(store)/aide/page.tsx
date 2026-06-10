import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { SupportButton } from "@/components/chat/support-button";

export const metadata = {
  title: "Aide & FAQ",
  description: "Questions frequentes sur DALOA HUB : commander, livraison, paiement, devenir vendeur ou livreur.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Comment passer une commande ?",
    a: "Parcourez les produits, ajoutez-les au panier, puis validez la commande en choisissant la livraison a domicile ou le retrait en boutique. Vous payez a la livraison (cash).",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le paiement se fait a la livraison, en especes. Vous reglez le livreur (ou le vendeur) au moment de recevoir votre commande. Meme en cas de refus du produit, les frais de deplacement du livreur restent dus.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Allez dans 'Mes commandes' depuis votre compte. Pour une livraison, vous voyez le livreur affecte et sa position en direct sur la carte.",
  },
  {
    q: "Qui livre ma commande ?",
    a: "Selon la boutique, c'est un livreur DALOA HUB (affecte automatiquement, le plus proche) ou le vendeur lui-meme. Vous avez toujours son nom et son numero.",
  },
  {
    q: "Puis-je negocier le prix ?",
    a: "Oui ! Sur la fiche d'un produit, cliquez sur 'Negocier le prix' pour discuter directement avec le vendeur dans la messagerie.",
  },
  {
    q: "Comment devenir vendeur ?",
    a: "Cliquez sur 'Devenir vendeur', creez votre boutique et ajoutez vos produits. Apres validation par l'equipe, votre boutique devient visible.",
  },
  {
    q: "Comment devenir livreur ?",
    a: "Inscrivez-vous comme livreur, ajoutez votre photo de profil et votre CNI. Apres verification par l'equipe, vous pourrez recevoir des livraisons.",
  },
  {
    q: "Que veut dire le badge bleu sur une boutique ?",
    a: "C'est une boutique certifiee par DALOA HUB : son identite a ete verifiee. Achetez en confiance.",
  },
  {
    q: "Comment laisser un avis ?",
    a: "Apres avoir recu un produit, rendez-vous sur sa fiche : vous pourrez lui attribuer une note et un commentaire (badge 'Achat verifie').",
  },
];

export default function AidePage() {
  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-orange text-white">
          <HelpCircle className="size-7" />
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Aide & FAQ</h1>
        <p className="mt-1 text-muted-foreground">Tout ce qu&apos;il faut savoir sur DALOA HUB.</p>
      </div>

      <div className="space-y-2">
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-xl border bg-card shadow-soft">
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 font-medium">
              {item.q}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="border-t p-4 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5 text-center shadow-soft">
        <p className="font-semibold">Vous n&apos;avez pas trouve votre reponse ?</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Notre assistant repond instantanement, et un conseiller prend le relais si besoin.
        </p>
        <div className="flex justify-center">
          <SupportButton className="max-w-sm" />
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Voir aussi nos{" "}
        <Link href="/cgu" className="text-primary hover:underline">conditions</Link> et notre{" "}
        <Link href="/confidentialite" className="text-primary hover:underline">politique de confidentialite</Link>.
      </p>
    </div>
  );
}

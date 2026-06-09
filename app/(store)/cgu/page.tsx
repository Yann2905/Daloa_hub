import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Conditions Generales d'Utilisation" };

const updated = "8 juin 2026";

export default function CguPage() {
  return (
    <article className="container max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-bold">Conditions Generales d&apos;Utilisation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Derniere mise a jour : {updated}</p>
      </header>

      <Section title="1. Objet">
        Les presentes conditions regissent l&apos;utilisation de la plateforme {APP_NAME},
        un service de mise en relation entre des vendeurs, des clients et des livreurs
        dans la ville de Daloa (Cote d&apos;Ivoire). En creant un compte ou en utilisant
        la plateforme, vous acceptez ces conditions.
      </Section>

      <Section title="2. Comptes et roles">
        L&apos;utilisateur peut s&apos;inscrire en tant que <strong>client</strong> (acheter),
        <strong> vendeur</strong> (vendre) ou <strong>livreur</strong> (livrer). Vous etes
        responsable de l&apos;exactitude des informations fournies et de la confidentialite
        de vos identifiants. Un livreur doit fournir une piece d&apos;identite (CNI) et un
        document de vehicule, et etre valide par l&apos;administration avant de pouvoir
        effectuer des livraisons.
      </Section>

      <Section title="3. Role de la plateforme">
        {APP_NAME} agit comme <strong>intermediaire technique</strong>. La plateforme
        n&apos;est pas vendeur des produits proposes : la responsabilite de la conformite,
        de la qualite et de la disponibilite des produits incombe au vendeur.
      </Section>

      <Section title="4. Commandes, paiement et livraison">
        Le client choisit la <strong>livraison a domicile</strong> (paiement a la livraison,
        frais de livraison applicables) ou le <strong>retrait en boutique</strong> (gratuit).
        Les frais de livraison sont calcules automatiquement selon le type de produit et la
        distance. Le client s&apos;engage a etre present et a regler le montant du a la
        reception ou au retrait.
      </Section>

      <Section title="5. Refus d'un produit">
        En cas de refus d&apos;un produit a la livraison, les <strong>frais de deplacement du
        livreur restent dus</strong> par le client. Le stock du vendeur est automatiquement
        reintegre.
      </Section>

      <Section title="6. Abonnement vendeur">
        L&apos;acces a l&apos;espace vendeur est soumis a un abonnement mensuel. En l&apos;absence
        d&apos;abonnement actif, la boutique et ses produits sont masques jusqu&apos;au
        renouvellement.
      </Section>

      <Section title="7. Evaluations et signalements">
        Apres une livraison, le client peut evaluer le vendeur et le livreur. Tout
        comportement frauduleux, produit non conforme ou abus peut etre signale et fera
        l&apos;objet d&apos;un examen par l&apos;administration, pouvant aller jusqu&apos;a la
        suspension du compte concerne.
      </Section>

      <Section title="8. Obligations des utilisateurs">
        Vous vous engagez a ne pas utiliser la plateforme a des fins illegales, a ne pas
        publier de contenu trompeur ou de produits interdits, et a respecter les autres
        utilisateurs. {APP_NAME} se reserve le droit de suspendre tout compte en cas de
        manquement.
      </Section>

      <Section title="9. Limitation de responsabilite">
        {APP_NAME} met en oeuvre les moyens raisonnables pour assurer le bon fonctionnement
        du service mais ne saurait etre tenu responsable des litiges entre clients, vendeurs
        et livreurs, ni des interruptions independantes de sa volonte.
      </Section>

      <Section title="10. Modification et contact">
        Ces conditions peuvent etre mises a jour. Pour toute question, contactez
        l&apos;administration via les coordonnees fournies dans l&apos;application.
      </Section>

      <p className="rounded-lg bg-secondary p-4 text-xs text-muted-foreground">
        Ce document est un modele fourni a titre indicatif et doit etre revu par un
        professionnel du droit avant exploitation commerciale.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}

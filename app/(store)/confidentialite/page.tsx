import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Politique de confidentialite" };

const updated = "8 juin 2026";

export default function PrivacyPage() {
  return (
    <article className="container max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-bold">Politique de confidentialite</h1>
        <p className="mt-2 text-sm text-muted-foreground">Derniere mise a jour : {updated}</p>
      </header>

      <Section title="1. Donnees que nous collectons">
        Selon votre role, nous collectons : nom, adresse e-mail, numero de telephone,
        mot de passe (chiffre), et pour les livreurs une piece d&apos;identite (CNI) et un
        document de vehicule. Lors d&apos;une commande, nous pouvons collecter votre
        <strong> position geographique</strong> (si vous l&apos;autorisez) et votre adresse de
        livraison, ainsi que l&apos;historique de vos commandes et evaluations.
      </Section>

      <Section title="2. Utilisation des donnees">
        Vos donnees servent a : creer et securiser votre compte, traiter les commandes,
        calculer les frais et affecter le livreur le plus proche, vous envoyer des
        notifications (e-mail / SMS) liees a vos commandes, et assurer la securite et la
        moderation de la plateforme.
      </Section>

      <Section title="3. Geolocalisation">
        La position GPS n&apos;est utilisee qu&apos;avec votre <strong>autorisation explicite</strong>,
        au moment de la commande (pour la livraison) ou lorsque le livreur est en ligne
        (pour l&apos;affectation et l&apos;itineraire). Vous pouvez refuser ou revoquer cette
        autorisation a tout moment dans les reglages de votre navigateur ; vous pourrez
        alors indiquer votre quartier manuellement.
      </Section>

      <Section title="4. Documents d'identite (livreurs)">
        Les pieces d&apos;identite des livreurs sont stockees de maniere <strong>privee</strong>
        et ne sont accessibles qu&apos;a l&apos;administration, uniquement pour la validation du
        compte, via des liens temporaires securises. Elles ne sont jamais rendues publiques.
      </Section>

      <Section title="5. Partage des donnees">
        Nous ne vendons pas vos donnees. Certaines informations strictement necessaires sont
        partagees entre les parties d&apos;une commande (par exemple, le quartier de livraison
        et le contact sont communiques au livreur affecte). Nous faisons appel a des
        prestataires techniques (hebergement, envoi d&apos;e-mails et de SMS, stockage
        d&apos;images, cartographie) qui traitent les donnees pour notre compte.
      </Section>

      <Section title="6. Conservation et securite">
        Les donnees sont conservees le temps necessaire au service. Nous appliquons des
        mesures de securite : mots de passe chiffres, controle d&apos;acces par role,
        limitation des tentatives de connexion et liens de verification a usage unique.
      </Section>

      <Section title="7. Vos droits">
        Vous pouvez demander l&apos;acces, la rectification ou la suppression de vos donnees,
        ainsi que la fermeture de votre compte, en contactant l&apos;administration via
        l&apos;application.
      </Section>

      <Section title="8. Contact">
        Pour toute question relative a vos donnees personnelles, contactez l&apos;equipe
        {" "}{APP_NAME} via les coordonnees fournies dans l&apos;application.
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

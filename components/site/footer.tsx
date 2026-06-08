import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-12 hidden border-t bg-white md:block">
      <div className="container grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            La marketplace de la ville de Daloa. Achetez, vendez, livrez.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Acheter</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/produits" className="hover:text-brand-green">Tous les produits</Link></li>
            <li><Link href="/commandes" className="hover:text-brand-green">Mes commandes</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Rejoindre</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/devenir-vendeur" className="hover:text-brand-green">Devenir vendeur</Link></li>
            <li><Link href="/devenir-livreur" className="hover:text-brand-green">Devenir livreur</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Compte</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-brand-green">Connexion</Link></li>
            <li><Link href="/inscription" className="hover:text-brand-green">Inscription</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DALOA HUB. Tous droits reserves.
        </p>
      </div>
    </footer>
  );
}

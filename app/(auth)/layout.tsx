import Link from "next/link";
import { ShoppingBag, Truck, Store, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panneau de marque (desktop) */}
      <aside className="relative hidden overflow-hidden bg-hero-gradient p-10 text-white lg:flex lg:flex-col">
        <div className="relative z-10 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold backdrop-blur">
            DH
          </span>
          <span className="text-xl font-bold tracking-tight">
            DALOA <span className="text-brand-emerald">HUB</span>
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight animate-in">
            La marketplace de Daloa, dans votre poche.
          </h2>
          <p className="mt-3 text-white/75 animate-in delay-75">
            Achetez, vendez et faites livrer en toute simplicite, partout dans la
            ville.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: ShoppingBag, t: "Achetez en quelques clics" },
              { icon: Store, t: "Ouvrez votre boutique en ligne" },
              { icon: Truck, t: "Livraison rapide ou retrait gratuit" },
              { icon: ShieldCheck, t: "Vendeurs et livreurs verifies" },
            ].map(({ icon: Icon, t }, i) => (
              <li
                key={t}
                className="flex items-center gap-3 animate-in"
                style={{ animationDelay: `${150 + i * 80}ms` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <Icon className="size-4 text-brand-emerald" />
                </span>
                <span className="text-sm text-white/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Halos decoratifs */}
        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand-green/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-72 w-72 rounded-full bg-brand-royal/30 blur-3xl" />
      </aside>

      {/* Formulaire */}
      <main className="flex flex-col items-center justify-center bg-secondary p-5 sm:p-8">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-md animate-in">
          <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            {children}
          </div>
          <Link
            href="/"
            className="mt-6 block text-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            &larr; Retour a la boutique
          </Link>
        </div>
      </main>
    </div>
  );
}

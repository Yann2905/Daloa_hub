import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-bold text-brand-green">404</p>
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La page que vous recherchez n&apos;existe pas ou a ete deplacee.
      </p>
      <Button asChild>
        <Link href="/">Retour a l&apos;accueil</Link>
      </Button>
    </div>
  );
}

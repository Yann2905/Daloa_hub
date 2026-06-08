import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Acces refuse" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldX className="size-12 text-destructive" />
      <h1 className="text-xl font-bold">Acces refuse</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Vous n&apos;avez pas les autorisations necessaires pour acceder a cette page.
      </p>
      <Button asChild>
        <Link href="/">Retour a l&apos;accueil</Link>
      </Button>
    </div>
  );
}

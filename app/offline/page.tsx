import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <WifiOff className="size-12 text-muted-foreground" />
      <h1 className="text-xl font-bold">Vous etes hors ligne</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Verifiez votre connexion internet. Certaines pages deja consultees
        restent accessibles.
      </p>
      <Button asChild>
        <Link href="/">Reessayer</Link>
      </Button>
    </div>
  );
}

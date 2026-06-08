import { Ban } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata = { title: "Compte suspendu" };

export default function SuspendedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Ban className="size-12 text-destructive" />
      <h1 className="text-xl font-bold">Compte suspendu</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Votre compte a ete suspendu par l&apos;administration. Contactez le
        support pour plus d&apos;informations.
      </p>
      <LogoutButton />
    </div>
  );
}

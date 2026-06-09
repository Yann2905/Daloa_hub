import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification de l'e-mail" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmailToken(token) : false;

  return (
    <div className="space-y-4 text-center">
      <div
        className={`mx-auto flex size-14 items-center justify-center rounded-full ${
          ok ? "bg-primary/10" : "bg-destructive/10"
        }`}
      >
        {ok ? (
          <CheckCircle2 className="size-7 text-primary" />
        ) : (
          <XCircle className="size-7 text-destructive" />
        )}
      </div>
      <h1 className="text-xl font-bold">
        {ok ? "E-mail confirme" : "Lien invalide ou expire"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {ok
          ? "Merci ! Votre adresse e-mail est verifiee. Votre compte est securise."
          : "Ce lien de verification n'est plus valable. Connectez-vous et renvoyez un nouveau lien depuis votre compte."}
      </p>
      <Button asChild>
        <Link href={ok ? "/compte" : "/login"}>
          {ok ? "Aller a mon compte" : "Se connecter"}
        </Link>
      </Button>
    </div>
  );
}

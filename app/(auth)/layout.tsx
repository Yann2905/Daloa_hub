import Link from "next/link";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        {children}
      </div>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-brand-green">
        Retour a la boutique
      </Link>
    </div>
  );
}

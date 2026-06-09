import { getMyDriver } from "@/lib/queries/driver";
import { getProfile } from "@/lib/auth";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { DocumentsForm } from "@/components/driver/documents-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes documents" };

export default async function DriverDocumentsPage() {
  const [driver, profile] = await Promise.all([getMyDriver(), getProfile()]);
  if (!driver || !profile) return null;
  const hasAvatar = !!profile.avatar_url;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <Badge variant={driver.status === "approved" ? "success" : driver.status === "rejected" ? "destructive" : "warning"}>
          {DRIVER_STATUS_LABELS[driver.status]}
        </Badge>
      </div>

      {/* Photo de profil : OBLIGATOIRE pour les livreurs */}
      <div className="space-y-2 rounded-xl border bg-card p-5 shadow-soft">
        <AvatarUpload name={profile.full_name} avatarUrl={profile.avatar_url} required size={88} />
        {!hasAvatar && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
            Ajoutez d&apos;abord votre photo de profil : elle est obligatoire et
            permet au vendeur de verifier votre identite avant de vous remettre la
            commande.
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Televersez votre CNI et le document de votre vehicule. Un administrateur
        validera votre compte avant que vous puissiez livrer.
      </p>
      <DocumentsForm driver={driver} hasAvatar={hasAvatar} />
    </div>
  );
}

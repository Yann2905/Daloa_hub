import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Devenir vendeur" };

export default function BecomeVendorPage() {
  return <SignupForm defaultRole="vendor" />;
}

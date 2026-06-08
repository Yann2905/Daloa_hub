import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Devenir livreur" };

export default function BecomeDriverPage() {
  return <SignupForm defaultRole="driver" />;
}

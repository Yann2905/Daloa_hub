import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <div className="mx-auto min-h-dvh max-w-2xl bg-secondary">{children}</div>;
}

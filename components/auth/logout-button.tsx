"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className={className}>
        <LogOut className="size-4" /> Se deconnecter
      </Button>
    </form>
  );
}

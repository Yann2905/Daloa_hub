import type { UserRole, AccountStatus } from "@/lib/database.types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      accountStatus: AccountStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    accountStatus: AccountStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    accountStatus: AccountStatus;
  }
}

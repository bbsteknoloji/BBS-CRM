import type { DefaultSession } from "next-auth";
import type { RoleCode } from "@prisma/client";
import type { Permission } from "@/lib/permissions/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string | null;
      roles: RoleCode[];
      permissions: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    companyId?: string | null;
    roles: RoleCode[];
    permissions: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId?: string | null;
    roles?: RoleCode[];
    permissions?: Permission[];
  }
}

import type { DefaultSession } from "next-auth";
import type { RoleCode } from "@prisma/client";
import type { Permission } from "@/lib/permissions/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: RoleCode[];
      permissions: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    roles: RoleCode[];
    permissions: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: RoleCode[];
    permissions?: Permission[];
  }
}

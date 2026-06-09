import type { RoleCode } from "@prisma/client";

/** Uygulama izinleri — seed ile senkron */
export const PERMISSIONS = [
  "customer:read",
  "customer:write",
  "customer:delete",
  "customer:assign",
  "customer:import",
  "quote:read",
  "quote:write",
  "quote:send",
  "quote:approve",
  "quote:convert",
  "quote:delete",
  "contract:read",
  "contract:write",
  "contract:terminate",
  "contract:renew",
  "contract:delete",
  "service:read",
  "service:write",
  "service:assign",
  "service:close",
  "service:delete",
  "visit:read",
  "visit:write",
  "task:read",
  "task:create",
  "task:update",
  "task:delete",
  "product:read",
  "product:create",
  "product:update",
  "product:delete",
  "document:read",
  "document:upload",
  "document:delete",
  "file:read",
  "file:download",
  "file:delete",
  "notification:read",
  "report:read",
  "report:export",
  "settings:read",
  "settings:manage",
  "user:read",
  "user:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: RoleCode[];
  permissions: Permission[];
};

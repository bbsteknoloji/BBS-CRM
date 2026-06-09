import type { Permission, SessionUser } from "./types";

export function hasPermission(
  user: Pick<SessionUser, "permissions"> | null | undefined,
  permission: Permission
): boolean {
  if (!user?.permissions?.length) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: Pick<SessionUser, "permissions"> | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(
  user: Pick<SessionUser, "permissions"> | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

export function hasRole(
  user: Pick<SessionUser, "roles"> | null | undefined,
  role: SessionUser["roles"][number]
): boolean {
  if (!user?.roles?.length) return false;
  return user.roles.includes(role);
}

export function isSuperAdmin(
  user: Pick<SessionUser, "roles"> | null | undefined
): boolean {
  return hasRole(user, "SUPER_ADMIN");
}

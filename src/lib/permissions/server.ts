import { redirect } from "next/navigation";
import type { Permission } from "./types";
import { hasAnyPermission, hasPermission } from "./check";
import { getSessionUser } from "@/lib/auth/session";

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!hasPermission(user, permission)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const user = await requireAuth();
  if (!hasAnyPermission(user, permissions)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}

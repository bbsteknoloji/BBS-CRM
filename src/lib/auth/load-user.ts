import type { RoleCode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Permission, SessionUser } from "@/lib/permissions/types";
import { PERMISSIONS } from "@/lib/permissions/types";

const KNOWN_PERMISSIONS = new Set<string>(PERMISSIONS);

function filterKnownPermissions(slugs: string[]): Permission[] {
  return slugs.filter((s): s is Permission => KNOWN_PERMISSIONS.has(s));
}

export async function loadUserByEmail(
  email: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      deletedAt: null,
      status: "ACTIVE",
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const roles = user.userRoles.map((ur) => ur.role.code as RoleCode);
  const permissionSet = new Set<string>();

  for (const ur of user.userRoles) {
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.slug);
    }
  }

  if (roles.includes("SUPER_ADMIN")) {
    PERMISSIONS.forEach((p) => permissionSet.add(p));
  }

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    companyId: user.companyId ?? null,
    roles,
    permissions: filterKnownPermissions([...permissionSet]),
  };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true, passwordHash: true },
  });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return loadUserByEmail(email);
}

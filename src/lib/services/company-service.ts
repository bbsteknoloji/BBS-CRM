import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { isSuperAdmin } from "@/lib/permissions/check";
import type { CompanyFormInput } from "@/lib/validations/company";

function requireSuperAdmin(user: SessionUser) {
  if (!isSuperAdmin(user)) throw new Error("Yetkisiz erişim");
}

export async function listCompanies(user: SessionUser) {
  requireSuperAdmin(user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy = [{ isActive: "desc" }, { name: "asc" }] as any;
  return prisma.company.findMany({
    orderBy,
    include: {
      _count: {
        select: {
          users: { where: { deletedAt: null } },
          customers: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export async function getCompany(user: SessionUser, id: string) {
  requireSuperAdmin(user);
  return prisma.company.findUnique({ where: { id } });
}

export async function getCompanyWithUsers(user: SessionUser, id: string) {
  requireSuperAdmin(user);
  return prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        where: { deletedAt: null },
        include: {
          userRoles: { include: { role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createCompany(user: SessionUser, data: CompanyFormInput) {
  requireSuperAdmin(user);
  return prisma.company.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
}

export async function updateCompany(
  user: SessionUser,
  id: string,
  data: CompanyFormInput
) {
  requireSuperAdmin(user);
  return prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
}

export async function setCompanyActive(
  user: SessionUser,
  id: string,
  isActive: boolean
) {
  requireSuperAdmin(user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.company.update({ where: { id }, data: { isActive } as any });
}

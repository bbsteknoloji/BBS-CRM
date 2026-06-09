import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "customer:import";

async function main() {
  const permission = await prisma.permission.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      name: "Müşteri içe aktar",
      module: "customer",
    },
    update: { name: "Müşteri içe aktar", module: "customer" },
  });

  const roles = await prisma.role.findMany({
    where: { code: { in: ["SUPER_ADMIN", "ADMIN", "SALES"] } },
    select: { id: true, code: true },
  });

  for (const role of roles) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: role.id, permissionId: permission.id },
      update: {},
    });
    console.log("Rol güncellendi:", role.code);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

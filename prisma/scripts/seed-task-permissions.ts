import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_PERMISSIONS = [
  { slug: "task:create", name: "Görev oluştur", module: "task" },
  { slug: "task:update", name: "Görev güncelle", module: "task" },
] as const;

async function main() {
  for (const def of NEW_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: def.slug },
      create: def,
      update: { name: def.name, module: def.module },
    });
    console.log("İzin upsert:", def.slug);
  }

  const legacy = await prisma.permission.findUnique({
    where: { slug: "task:write" },
  });
  if (legacy) {
    const rolesWithWrite = await prisma.rolePermission.findMany({
      where: { permissionId: legacy.id },
      select: { roleId: true },
    });

    const createPerm = await prisma.permission.findUniqueOrThrow({
      where: { slug: "task:create" },
    });
    const updatePerm = await prisma.permission.findUniqueOrThrow({
      where: { slug: "task:update" },
    });

    for (const { roleId } of rolesWithWrite) {
      for (const permissionId of [createPerm.id, updatePerm.id]) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          create: { roleId, permissionId },
          update: {},
        });
      }
    }

    await prisma.rolePermission.deleteMany({
      where: { permissionId: legacy.id },
    });
    await prisma.permission.delete({ where: { id: legacy.id } });
    console.log("Eski task:write izni kaldırıldı");
  }

  const permissionIds = await prisma.permission.findMany({
    where: {
      slug: {
        in: ["task:read", "task:create", "task:update", "task:delete"],
      },
    },
    select: { id: true },
  });

  const roles = await prisma.role.findMany({
    where: { code: { in: ["SUPER_ADMIN", "ADMIN", "SALES"] } },
    select: { id: true, code: true },
  });

  for (const role of roles) {
    for (const permission of permissionIds) {
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
    }
    console.log("Rol güncellendi:", role.code);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

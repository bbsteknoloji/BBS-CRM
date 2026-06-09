import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_PERMISSIONS = [
  { slug: "product:create", name: "Ürün oluştur", module: "product" },
  { slug: "product:update", name: "Ürün güncelle", module: "product" },
  { slug: "product:delete", name: "Ürün sil", module: "product" },
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
    where: { slug: "product:write" },
  });
  if (legacy) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: legacy.id },
    });
    await prisma.permission.delete({ where: { id: legacy.id } });
    console.log("Eski product:write izni kaldırıldı");
  }

  const permissionIds = await prisma.permission.findMany({
    where: {
      slug: {
        in: ["product:read", ...NEW_PERMISSIONS.map((p) => p.slug)],
      },
    },
    select: { id: true, slug: true },
  });

  const roles = await prisma.role.findMany({
    where: { code: { in: ["SUPER_ADMIN", "ADMIN"] } },
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

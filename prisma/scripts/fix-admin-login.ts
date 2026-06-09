/**
 * Admin giriş düzeltme — tek seferlik çalıştırma:
 * npx tsx prisma/scripts/fix-admin-login.ts
 */
import { PrismaClient, RoleCode } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "info@bbsteknoloji.com.tr";
const ADMIN_PASSWORD = "955262Ku";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Mevcut kullanıcılar (silinmemiş) ---\n");
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      userRoles: { include: { role: { select: { code: true } } } },
    },
    orderBy: { email: "asc" },
  });

  if (users.length === 0) {
    console.log("(kayıt yok)\n");
  } else {
    for (const u of users) {
      const roles = u.userRoles.map((ur) => ur.role.code).join(", ");
      console.log(
        `${u.email} | ${u.firstName} ${u.lastName} | ${u.status} | roller: ${roles || "-"}`
      );
    }
    console.log("");
  }

  const target = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL.toLowerCase(), deletedAt: null },
  });

  console.log(`Hedef e-posta (${ADMIN_EMAIL}): ${target ? "KAYITLI" : "YOK"}\n`);

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.SUPER_ADMIN },
  });

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {
      passwordHash: hash,
      status: "ACTIVE",
      firstName: "BBS",
      lastName: "Admin",
      deletedAt: null,
    },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash: hash,
      firstName: "BBS",
      lastName: "Admin",
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: user.id, roleId: superAdminRole.id },
    },
    update: {},
    create: { userId: user.id, roleId: superAdminRole.id },
  });

  const verify = await bcrypt.compare(ADMIN_PASSWORD, hash);
  console.log("Şifre hash doğrulama:", verify ? "OK" : "HATA");
  console.log("\n✅ Giriş bilgileri:");
  console.log(`   E-posta: ${ADMIN_EMAIL}`);
  console.log(`   Şifre:   ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

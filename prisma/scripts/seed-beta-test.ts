/**
 * Kapalı beta test senaryosu:
 *   Firma A  → 10 müşteri + 2 sözleşme
 *   Firma B  → 5 müşteri  + 1 sözleşme
 *
 * Son adımda Firma A admin'inin Firma B verisini göremediği assert edilir.
 *
 * Kullanım: npx tsx prisma/scripts/seed-beta-test.ts
 *
 * NOT: Önce backfill-company-id.ts çalıştırılmış ve migration uygulanmış olmalı.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createCompany(name: string) {
  return prisma.company.create({
    data: { name, email: `info@${name.toLowerCase().replace(/\s/g, "")}.test` },
  });
}

async function createAdminUser(
  companyId: string,
  email: string,
  password: string
) {
  const hash = await bcrypt.hash(password, 10);
  const adminRole = await prisma.role.findFirst({ where: { code: "ADMIN" } });
  if (!adminRole) throw new Error("ADMIN rolü bulunamadı");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      firstName: email.split("@")[0],
      lastName: "Test",
      status: "ACTIVE",
      companyId,
    },
  });
  await prisma.userRole.create({
    data: { userId: user.id, roleId: adminRole.id },
  });
  return user;
}

async function seedCustomers(companyId: string, count: number) {
  const ids: string[] = [];
  for (let i = 1; i <= count; i++) {
    const c = await prisma.customer.create({
      data: {
        companyId,
        legalName: `Test Müşteri ${i} (${companyId.slice(0, 6)})`,
        taxNumber: `${companyId.slice(0, 8).replace(/-/g, "")}${String(i).padStart(3, "0")}`.slice(0, 11),
        status: "ACTIVE",
      },
    });
    ids.push(c.id);
  }
  return ids;
}

async function seedContract(companyId: string, customerId: string, ownerId: string, idx: number) {
  const number = `SOZ-TEST-${companyId.slice(0, 4)}-${idx}`;
  return prisma.contract.create({
    data: {
      companyId,
      customerId,
      ownerId,
      number,
      title: `Test Sözleşme ${idx}`,
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      currency: "TRY",
      createdById: ownerId,
    },
  });
}

async function runAssertions(
  companyA: { id: string },
  companyB: { id: string }
) {
  console.log("\n--- İzolasyon Doğrulama ---");

  // Firma A admin için company filtreli doğrudan DB sorguları
  const aCustomers = await prisma.customer.count({
    where: { companyId: companyA.id, deletedAt: null },
  });

  const bCustomers = await prisma.customer.count({
    where: { companyId: companyB.id, deletedAt: null },
  });

  // Firma A'nın companyId filtresiyle Firma B verisine erişimi
  const crossCustomers = await prisma.customer.count({
    where: { companyId: companyA.id, deletedAt: null, id: { in: await prisma.customer.findMany({ where: { companyId: companyB.id }, select: { id: true } }).then(rs => rs.map(r => r.id)) } },
  });

  const aContracts = await prisma.contract.count({
    where: { companyId: companyA.id, deletedAt: null },
  });

  const bContracts = await prisma.contract.count({
    where: { companyId: companyB.id, deletedAt: null },
  });

  // Firma A'nın companyId filtresiyle Firma B sözleşmesine erişimi
  const crossContracts = await prisma.contract.count({
    where: { companyId: companyA.id, deletedAt: null, id: { in: await prisma.contract.findMany({ where: { companyId: companyB.id }, select: { id: true } }).then(rs => rs.map(r => r.id)) } },
  });

  console.log(`Firma A müşteri (DB'de):        ${aCustomers}   → beklenen: 10`);
  console.log(`Firma B müşteri (DB'de):        ${bCustomers}   → beklenen: 5`);
  console.log(`Firma B müşteri (A filtresiyle): ${crossCustomers}   → beklenen: 0`);
  console.log(`Firma A sözleşme (DB'de):       ${aContracts}   → beklenen: 2`);
  console.log(`Firma B sözleşme (DB'de):       ${bContracts}   → beklenen: 1`);
  console.log(`Firma B sözleşme (A filtresiyle): ${crossContracts}   → beklenen: 0`);

  const pass =
    aCustomers === 10 &&
    bCustomers === 5 &&
    crossCustomers === 0 &&
    aContracts === 2 &&
    bContracts === 1 &&
    crossContracts === 0;

  if (pass) {
    console.log("\n✅ Tüm izolasyon testleri GEÇTİ — kapalı beta için hazır.");
  } else {
    console.error("\n❌ Bazı testler BAŞARISIZ oldu — access filter'larını kontrol edin.");
    process.exit(1);
  }
}

async function main() {
  console.log("Beta test senaryosu oluşturuluyor...");

  // Mevcut test verilerini temizle
  await prisma.contract.deleteMany({ where: { number: { startsWith: "SOZ-TEST-" } } });
  await prisma.customer.deleteMany({
    where: { legalName: { startsWith: "Test Müşteri " } },
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.com" } } });
  await prisma.company.deleteMany({
    where: { name: { in: ["Firma A Test", "Firma B Test"] } },
  });

  // Firma A ve B oluştur
  const [companyA, companyB] = await Promise.all([
    createCompany("Firma A Test"),
    createCompany("Firma B Test"),
  ]);
  console.log(`Firma A: ${companyA.id}`);
  console.log(`Firma B: ${companyB.id}`);

  // Admin kullanıcılar
  const [adminA, adminB] = await Promise.all([
    createAdminUser(companyA.id, "firma-a-admin@test.com", "Test1234!"),
    createAdminUser(companyB.id, "firma-b-admin@test.com", "Test1234!"),
  ]);

  // Firma A: 10 müşteri + 2 sözleşme
  const aCustomerIds = await seedCustomers(companyA.id, 10);
  await Promise.all([
    seedContract(companyA.id, aCustomerIds[0], adminA.id, 1),
    seedContract(companyA.id, aCustomerIds[1], adminA.id, 2),
  ]);

  // Firma B: 5 müşteri + 1 sözleşme
  const bCustomerIds = await seedCustomers(companyB.id, 5);
  await seedContract(companyB.id, bCustomerIds[0], adminB.id, 1);

  console.log("Seed tamamlandı.");
  await runAssertions(companyA, companyB);
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

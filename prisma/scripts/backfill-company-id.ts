/**
 * Migration sonrası çalıştırılır.
 * Mevcut tüm kayıtları companies tablosundaki ilk şirkete bağlar.
 *
 * Kullanım: npx tsx prisma/scripts/backfill-company-id.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error(
      "companies tablosunda kayıt bulunamadı. Önce bir şirket oluşturun."
    );
  }

  console.log(`Backfill hedefi: ${company.name} (${company.id})`);

  const [
    customers,
    contracts,
    quotes,
    serviceTickets,
    tasks,
    visitRecords,
    numberSeqs,
    users,
  ] = await Promise.all([
    prisma.customer.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.contract.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.quote.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.serviceTicket.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.task.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.visitRecord.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.numberSequence.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
    prisma.user.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    }),
  ]);

  console.log("Backfill tamamlandı:");
  console.log(`  customers:       ${customers.count}`);
  console.log(`  contracts:       ${contracts.count}`);
  console.log(`  quotes:          ${quotes.count}`);
  console.log(`  service_tickets: ${serviceTickets.count}`);
  console.log(`  tasks:           ${tasks.count}`);
  console.log(`  visit_records:   ${visitRecords.count}`);
  console.log(`  number_seqs:     ${numberSeqs.count}`);
  console.log(`  users:           ${users.count}`);
}

main()
  .catch((e) => {
    console.error("Backfill hatası:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

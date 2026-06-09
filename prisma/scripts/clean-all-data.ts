/**
 * PostgreSQL test verilerini temizler.
 * User ve Company korunur.
 *
 * npx ts-node prisma/scripts/clean-all-data.ts
 * npx tsx prisma/scripts/clean-all-data.ts
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tx = Prisma.TransactionClient;

type DeleteStep = {
  label: string;
  run: (tx: Tx) => Promise<number>;
};

const steps: DeleteStep[] = [
  {
    label: "notifications",
    run: (tx) => tx.notification.deleteMany().then((r) => r.count),
  },
  {
    label: "audit_logs",
    run: (tx) => tx.auditLog.deleteMany().then((r) => r.count),
  },
  {
    label: "activities",
    run: (tx) => tx.activity.deleteMany().then((r) => r.count),
  },
  {
    label: "document_links",
    run: (tx) => tx.documentLink.deleteMany().then((r) => r.count),
  },
  {
    label: "documents",
    run: (tx) => tx.document.deleteMany().then((r) => r.count),
  },
  {
    label: "tasks",
    run: (tx) => tx.task.deleteMany().then((r) => r.count),
  },
  {
    label: "visit_records",
    run: (tx) => tx.visitRecord.deleteMany().then((r) => r.count),
  },
  {
    label: "service_tickets",
    run: (tx) => tx.serviceTicket.deleteMany().then((r) => r.count),
  },
  {
    label: "contract_devices",
    run: (tx) => tx.contractDevice.deleteMany().then((r) => r.count),
  },
  {
    label: "contract_pdf_versions",
    run: (tx) => tx.contractPdfVersion.deleteMany().then((r) => r.count),
  },
  {
    label: "contract_line_items",
    run: (tx) => tx.contractLineItem.deleteMany().then((r) => r.count),
  },
  {
    label: "contract_renewals",
    run: (tx) => tx.contractRenewal.deleteMany().then((r) => r.count),
  },
  {
    label: "quotes.converted_contract_id (null)",
    run: (tx) =>
      tx.quote
        .updateMany({
          data: { convertedContractId: null },
          where: { convertedContractId: { not: null } },
        })
        .then((r) => r.count),
  },
  {
    label: "contracts.parent_contract_id (null)",
    run: (tx) =>
      tx.contract
        .updateMany({
          data: { parentContractId: null },
          where: { parentContractId: { not: null } },
        })
        .then((r) => r.count),
  },
  {
    label: "contracts",
    run: (tx) => tx.contract.deleteMany().then((r) => r.count),
  },
  {
    label: "quote_pdf_versions",
    run: (tx) => tx.quotePdfVersion.deleteMany().then((r) => r.count),
  },
  {
    label: "quote_revisions",
    run: (tx) => tx.quoteRevision.deleteMany().then((r) => r.count),
  },
  {
    label: "quote_line_items",
    run: (tx) => tx.quoteLineItem.deleteMany().then((r) => r.count),
  },
  {
    label: "quotes",
    run: (tx) => tx.quote.deleteMany().then((r) => r.count),
  },
  {
    label: "customer_contacts",
    run: (tx) => tx.customerContact.deleteMany().then((r) => r.count),
  },
  {
    label: "customer_addresses",
    run: (tx) => tx.customerAddress.deleteMany().then((r) => r.count),
  },
  {
    label: "customer_devices",
    run: (tx) => tx.customerDevice.deleteMany().then((r) => r.count),
  },
  {
    label: "customers",
    run: (tx) => tx.customer.deleteMany().then((r) => r.count),
  },
  {
    label: "products",
    run: (tx) => tx.product.deleteMany().then((r) => r.count),
  },
  {
    label: "number_sequences",
    run: (tx) => tx.numberSequence.deleteMany().then((r) => r.count),
  },
];

async function main() {
  console.log("=== BBS CRM — Test Verisi Temizleme ===\n");
  console.log("Korunan tablolar: users, companies, roles, permissions, settings\n");

  let totalDeleted = 0;

  await prisma.$transaction(async (tx) => {
    for (const step of steps) {
      const count = await step.run(tx);
      totalDeleted += count;
      console.log(`  ${step.label}: ${count}`);
    }
  });

  const [users, companies] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
  ]);

  console.log("\n--- Özet ---");
  console.log(`Toplam silinen/güncellenen kayıt: ${totalDeleted}`);
  console.log(`Kalan kullanıcı: ${users}`);
  console.log(`Kalan şirket: ${companies}`);
  console.log("\nTemizleme tamamlandı.");
}

main()
  .catch((error) => {
    console.error("\nHata:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

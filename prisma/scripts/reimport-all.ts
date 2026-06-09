const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");
const path = require("path");

const p = new PrismaClient();
const root = path.resolve(__dirname, "../..");
const excel = path.join(root, "BBS_CRM_Birlesik_Liste.xlsx");

async function main() {
  const del = await p.customerDevice.deleteMany({});
  console.log("Silinen cihaz:", del.count);

  execSync(`npx ts-node --transpile-only prisma/scripts/import-musteriler.ts "${excel}"`, {
    cwd: root,
    stdio: "inherit",
  });

  execSync(`npx ts-node --transpile-only prisma/scripts/import-cihazlar.ts "${excel}"`, {
    cwd: root,
    stdio: "inherit",
  });

  const orphans = await p.customerDevice.deleteMany({ where: { customerId: null } });
  console.log("Silinen yetim cihaz (Midyat vb.):", orphans.count);

  const top = await p.customer.findMany({
    where: { deletedAt: null, devices: { some: {} } },
    select: { legalName: true, _count: { select: { devices: true } } },
    orderBy: { devices: { _count: "desc" } },
    take: 8,
  });

  console.log("\n--- Cihazlı müşteriler ---");
  for (const c of top) {
    console.log(`${c._count.devices} cihaz | ${c.legalName}`);
  }

  const total = await p.customerDevice.count();
  const withCust = await p.customer.count({ where: { devices: { some: {} } } });
  console.log(`\nToplam: ${total} cihaz, ${withCust} müşteride`);
}

main().finally(() => p.$disconnect());

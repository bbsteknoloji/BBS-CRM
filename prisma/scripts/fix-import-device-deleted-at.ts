const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const result = await p.customerDevice.updateMany({
    where: {
      deletedAt: { not: null },
      notes: { contains: "Kaynak:" },
    },
    data: { deletedAt: null },
  });
  console.log("Restored import devices:", result.count);

  const total = await p.customerDevice.count();
  const withCustomer = await p.customerDevice.count({
    where: { customerId: { not: null } },
  });
  const customersWithDevices = await p.customer.count({
    where: { deletedAt: null, devices: { some: {} } },
  });
  console.log({ total, withCustomer, customersWithDevices });
}

main().finally(() => p.$disconnect());

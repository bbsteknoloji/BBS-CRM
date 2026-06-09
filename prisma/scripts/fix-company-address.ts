import { prisma } from "../../src/lib/db";
import { company } from "../../src/config/company";

async function main() {
  const updated = await prisma.company.updateMany({
    data: { address: company.address },
  });
  console.log("Güncellenen kayıt:", updated.count);
  console.log("Yeni adres:", company.address);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

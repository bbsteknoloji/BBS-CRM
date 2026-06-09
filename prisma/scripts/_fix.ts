const fs = require("fs");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const cr = XLSX.utils.sheet_to_json(
    XLSX.read(fs.readFileSync("BBS_CRM_Birlesik_Liste.xlsx"), { type: "buffer" }).Sheets[
      "Cihazlar"
    ],
    { header: 1, defval: "" }
  );

  let matched = 0;
  let unmatched = 0;
  for (let i = 1; i < cr.length; i++) {
    const name = String(cr[i][2]).trim();
    const sn = String(cr[i][0]).trim();
    const dev = await p.customerDevice.findFirst({
      where: { serialNumber: { equals: sn, mode: "insensitive" } },
      select: { customerId: true, customer: { select: { legalName: true } } },
    });
    if (dev?.customerId) {
      matched++;
      if (matched <= 5) console.log("OK", sn, "| cihaz:", name.slice(0, 50), "| db:", dev.customer?.legalName?.slice(0, 50));
    } else {
      unmatched++;
      if (unmatched <= 5) console.log("NO", sn, "|", name.slice(0, 60));
    }
  }
  console.log("matched", matched, "unmatched", unmatched);
}

main().finally(() => p.$disconnect());

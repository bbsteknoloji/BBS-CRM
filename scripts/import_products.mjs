import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const rows = JSON.parse(readFileSync("C:/temp/urunler_import.json", "utf-8"));

let created = 0, updated = 0, skipped = 0;

for (const r of rows) {
  try {
    const existing = await prisma.product.findUnique({ where: { sku: r.sku } });
    if (existing) {
      await prisma.product.update({
        where: { sku: r.sku },
        data: {
          name: r.name,
          unit: r.unit,
          unitPrice: r.unitPrice,
          currency: r.currency,
          taxRate: r.taxRate,
          isActive: r.isActive,
          type: r.type,
        }
      });
      updated++;
    } else {
      await prisma.product.create({ data: r });
      created++;
    }
  } catch (e) {
    console.error("HATA:", r.sku, e.message);
    skipped++;
  }
}

console.log(`Tamamlandi — Yeni: ${created}, Guncellendi: ${updated}, Hata: ${skipped}`);
await prisma.$disconnect();

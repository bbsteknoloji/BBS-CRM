import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

function sim(a, b) {
  const clean = s => s.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
  const sa = new Set(clean(a).split(' ').filter(x => x.length > 1));
  const sb = new Set(clean(b).split(' ').filter(x => x.length > 1));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa,...sb]).size;
  return union === 0 ? 0 : inter / union;
}

async function main() {
  const buf = readFileSync('C:/Users/BBS/Downloads/Müşteriler&Tedarikçiler_20260607125250.xlsx');
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const logoRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const customers = await prisma.customer.findMany();

  let guncellenen = 0, eslesmedi = 0;
  const eslesmeyenler = [];

  for (const crm of customers) {
    let bestScore = 0, bestRow = null;
    for (const lr of logoRows) {
      const vals = Object.values(lr);
      const logoIsim = String(vals[3] ?? '').trim();
      if (!logoIsim) continue;
      const s = sim(crm.legalName, logoIsim);
      if (s > bestScore) { bestScore = s; bestRow = vals; }
    }

    if (bestScore >= 0.45 && bestRow) {
      const taxNumber = String(bestRow[11] ?? '').trim() || null;
      const taxOffice = String(bestRow[12] ?? '').trim() || null;
      const city      = String(bestRow[7]  ?? '').trim() || null;
      const district  = String(bestRow[8]  ?? '').trim() || null;
      const address   = String(bestRow[9]  ?? '').trim() || null;
      const phone     = String(bestRow[10] ?? '').trim() || null;
      const email     = String(bestRow[19] ?? '').trim() || null;

      // taxNumber unique kontrolü
      let safeTaxNumber = taxNumber;
      if (taxNumber) {
        const existing = await prisma.customer.findFirst({
          where: { taxNumber, NOT: { id: crm.id } }
        });
        if (existing) safeTaxNumber = null;
      }

      await prisma.customer.update({
        where: { id: crm.id },
        data: {
          taxNumber: safeTaxNumber,
          taxOffice: taxOffice || null,
        }
      });

      // Adres güncelle/ekle
      if (city) {
        const existing = await prisma.customerAddress.findFirst({ where: { customerId: crm.id } });
        if (existing) {
          await prisma.customerAddress.update({
            where: { id: existing.id },
            data: { city, district: district || null, line1: address || null }
          });
        } else {
          await prisma.customerAddress.create({
            data: { customerId: crm.id, type: 'HEADQUARTERS', city, district: district || null, line1: address || null }
          });
        }
      }

      // Telefon/email güncelle
      if (phone || email) {
        const existingContact = await prisma.customerContact.findFirst({ where: { customerId: crm.id } });
        if (existingContact) {
          await prisma.customerContact.update({
            where: { id: existingContact.id },
            data: { phone: phone || existingContact.phone, email: email || existingContact.email }
          });
        } else if (phone || email) {
          await prisma.customerContact.create({
            data: { customerId: crm.id, fullName: crm.legalName, phone: phone || null, email: email || null, isPrimary: true }
          });
        }
      }

      console.log(`[%${Math.round(bestScore*100)}] ${crm.legalName} → VKN:${safeTaxNumber ?? '-'} | ${city ?? '-'}`);
      guncellenen++;
    } else {
      eslesmeyenler.push(`${crm.legalName} (en iyi: %${Math.round(bestScore*100)})`);
      eslesmedi++;
    }
  }

  console.log(`\n✓ Güncellenen: ${guncellenen}`);
  console.log(`✗ Eşleşemeyen (vergi no girilemedi): ${eslesmedi}`);
  if (eslesmeyenler.length) {
    console.log('\n--- Eşleşemeyen müşteriler ---');
    eslesmeyenler.forEach(x => console.log(' ', x));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

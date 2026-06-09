import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

function similarity(a, b) {
  const clean = s => s.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, ' ').replace(/\s+/g,' ').trim();
  const sa = new Set(clean(a).split(' '));
  const sb = new Set(clean(b).split(' '));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa,...sb]).size;
  return union === 0 ? 0 : inter / union;
}

async function main() {
  const buf = readFileSync('C:/Users/BBS/Downloads/TinaxDestekPaketleri (1).xlsx');
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  // CRM'deki tüm müşterileri al
  const customers = await prisma.customer.findMany({ select: { id: true, legalName: true } });

  let eslesti = 0, eslesmedi = 0;

  for (const row of rows) {
    const vals = Object.values(row);
    const seriNo    = String(vals[0] ?? '').trim();
    const model     = String(vals[1] ?? '').trim();
    const tinaxIsim = String(vals[2] ?? '').trim();
    const bayi      = String(vals[3] ?? '').trim();
    const aciklama  = String(vals[4] ?? '').trim();
    const hizmetSonu = vals[5] ? new Date(vals[5]) : null;
    const durum     = String(vals[7] ?? '').trim();

    if (!seriNo && !model) continue;

    // Müşteriyi bul
    let bestScore = 0, bestCustomer = null;
    for (const c of customers) {
      const s = similarity(tinaxIsim, c.legalName);
      if (s > bestScore) { bestScore = s; bestCustomer = c; }
    }

    const customerId = bestScore >= 0.4 ? bestCustomer.id : null;
    if (customerId) eslesti++; else eslesmedi++;

    const notes = [
      bayi ? `Bayi: ${bayi}` : '',
      aciklama ? `Bölge: ${aciklama}` : '',
      hizmetSonu ? `Hizmet Sonu: ${hizmetSonu.toISOString().slice(0,10)}` : '',
      durum ? `Durum: ${durum}` : '',
    ].filter(Boolean).join(' | ');

    await prisma.customerDevice.create({
      data: {
        customerId,
        deviceName: model || seriNo,
        model: model || null,
        serialNumber: seriNo || null,
        notes: notes || null,
      }
    });

    const label = customerId ? bestCustomer.legalName : '(müşteri bulunamadı)';
    console.log(`[${Math.round(bestScore*100)}%] ${seriNo} ${model} → ${label}`);
  }

  console.log(`\nTamamlandı. Eşleşen: ${eslesti}, Eşleşemeyen: ${eslesmedi}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

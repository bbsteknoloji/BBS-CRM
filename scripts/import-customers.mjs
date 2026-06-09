import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

function turkishTitle(text) {
  if (!text) return text;
  const trLower = { 'I':'ı','İ':'i','Ç':'ç','Ğ':'ğ','Ö':'ö','Ş':'ş','Ü':'ü','Â':'â','Î':'î','Û':'û' };
  const trUpper = { 'i':'İ','ı':'I','ç':'Ç','ğ':'Ğ','ö':'Ö','ş':'Ş','ü':'Ü' };
  return text.trim().split(/\s+/).map(w => {
    if (!w) return w;
    let lw = w.split('').map(c => trLower[c] ?? c.toLowerCase()).join('');
    let first = lw[0];
    let big = trUpper[first] ?? first.toUpperCase();
    return big + lw.slice(1);
  }).join(' ');
}

function tokenSort(a, b) {
  return a.toLowerCase().split(/\s+/).sort().join(' ') === 
         b.toLowerCase().split(/\s+/).sort().join(' ');
}

function similarity(a, b) {
  const na = a.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, ' ').replace(/\s+/g,' ').trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, ' ').replace(/\s+/g,' ').trim();
  const sa = new Set(na.split(' '));
  const sb = new Set(nb.split(' '));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa,...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function readExcel(path) {
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

async function main() {
  const logoRows  = readExcel('C:/Users/BBS/Downloads/Müşteriler&Tedarikçiler_20260607125250.xlsx');
  const tinaxRows = readExcel('C:/Users/BBS/Downloads/TinaxDestekPaketleri (1).xlsx');

  // Logo index: ünvan -> row
  const logoMap = new Map();
  for (const r of logoRows) {
    const unvan = Object.values(r)[3];
    if (unvan) logoMap.set(String(unvan).trim(), r);
  }
  const logoNames = [...logoMap.keys()];

  // TinaX benzersiz müşteriler
  const tinaxCol = Object.keys(tinaxRows[0])[2];
  const unique = [...new Set(tinaxRows.map(r => String(r[tinaxCol] ?? '').trim()).filter(Boolean))];

  const ESIK = 0.55;
  let eslesen = 0, eslesmayan = 0;

  for (const tinaxIsim of unique) {
    // En iyi eşleşmeyi bul
    let bestScore = 0, bestName = null;
    for (const ln of logoNames) {
      const s = similarity(tinaxIsim, ln);
      if (s > bestScore) { bestScore = s; bestName = ln; }
    }

    let legalName, taxNumber = null, taxOffice = null, city = null, district = null, address = null, phone = null, email = null, logoKod = null;

    if (bestScore >= ESIK && bestName) {
      const lr = logoMap.get(bestName);
      const vals = Object.values(lr);
      legalName  = turkishTitle(String(vals[3] ?? '').trim()) || turkishTitle(tinaxIsim);
      taxNumber  = String(vals[11] ?? '').trim() || null;
      taxOffice  = String(vals[12] ?? '').trim() || null;
      city       = String(vals[7]  ?? '').trim() || null;
      district   = String(vals[8]  ?? '').trim() || null;
      address    = String(vals[9]  ?? '').trim() || null;
      phone      = String(vals[10] ?? '').trim() || null;
      email      = String(vals[19] ?? '').trim() || null;
      logoKod    = vals[0];
      eslesen++;
    } else {
      legalName = turkishTitle(tinaxIsim);
      eslesmayan++;
    }

    // taxNumber unique — aynı vergi no varsa atla
    if (taxNumber) {
      const existing = await prisma.customer.findUnique({ where: { taxNumber } });
      if (existing) {
        console.log(`ATLA (duplicate VKN): ${legalName}`);
        continue;
      }
    }

    await prisma.customer.create({
      data: {
        legalName,
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
        status: 'ACTIVE',
        metadata: logoKod ? { logoCustomerCode: String(logoKod) } : undefined,
        ...(city && {
          addresses: {
            create: {
              type: 'HEADQUARTERS',
              city,
              district: district || null,
              line1: address || null,
            }
          }
        }),
        ...(phone && {
          contacts: {
            create: {
              name: legalName,
              phone: phone || null,
              email: email || null,
              isPrimary: true,
            }
          }
        }),
      }
    });

    console.log(`[${bestScore >= ESIK ? `EŞLEŞTI %${Math.round(bestScore*100)}` : 'YENİ'}] ${legalName}`);
  }

  console.log(`\nTamamlandı. Eşleşen: ${eslesen}, Yeni: ${eslesmayan}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

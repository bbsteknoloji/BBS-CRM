/**
 * Standart sözleşme motoru test scripti — FAZ 3 EK senaryoları.
 * npx tsx scripts/test-contract-engine.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { PDFDocument } from "pdf-lib";
import { NO_INVOICE_TEXT } from "../src/lib/contracts/contract-invoice-resolver";
import { formatDeviceList } from "../src/lib/contracts/contract-placeholder-service";
import {
  CONTRACT_TEMPLATE_RELATIVE_PATH,
  getContractTemplatePath,
  mergeContractTemplate,
} from "../src/lib/contracts/contract-template-service";
import { convertContractDocxToPdf } from "../src/lib/contracts/contract-docx-to-pdf";
import {
  applyBbsStampToPdf,
  getBbsStampPath,
} from "../src/lib/contracts/contract-stamp";
import type { ContractTemplatePlaceholders } from "../src/lib/contracts/contract-template-types";

const OUT_DIR = path.join(process.cwd(), "storage/test-output/contract-engine");

const device1 = [
  {
    deviceName: "HGW Start 15DF",
    brand: "Tinax",
    model: "15-DF",
    serialNumber: "20123658256",
  },
];

const device5 = [
  ...device1,
  {
    deviceName: "UPS 3KVA",
    brand: "Inform",
    model: "Sinus Evo",
    serialNumber: "UPS-2026-001",
  },
  {
    deviceName: "Switch 24 Port",
    brand: "Cisco",
    model: "SG350",
    serialNumber: "SW-001",
  },
  {
    deviceName: "Firewall",
    brand: "Fortinet",
    model: "FG-60F",
    serialNumber: "FW-001",
  },
  {
    deviceName: "Access Point",
    brand: "Ubiquiti",
    model: "U6-Pro",
    serialNumber: "AP-001",
  },
];

type Check = { name: string; ok: boolean; detail: string };

function basePlaceholders(
  overrides: Partial<ContractTemplatePlaceholders> = {}
): ContractTemplatePlaceholders {
  return {
    contractNumber: "SOZ-TEST-0001",
    contractDate: "06.06.2026",
    contractStartDate: "01.06.2026",
    contractEndDate: "31.05.2027",
    customerName: "Test İdare A.Ş.",
    taxNumber: "1234567890",
    taxOffice: "Test Vergi Dairesi",
    address: "Test Mah. Test Cad. No:1 Erzurum",
    phone: "0442 000 00 00",
    email: "test@ornek.com",
    contractAmount: "12.000,00 TL (KDV Hariç)",
    deviceList: formatDeviceList(device1),
    invoiceNumber: "INV-2026-00125",
    ...overrides,
  };
}

function readDocxXml(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  return zip.file("word/document.xml")?.asText() ?? "";
}

async function runScenario(
  slug: string,
  placeholders: ContractTemplatePlaceholders,
  options: { stamp?: boolean } = {}
): Promise<{ checks: Check[]; docx?: Buffer; pdf?: Buffer }> {
  const checks: Check[] = [];
  const dir = path.join(OUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  let docx: Buffer;
  try {
    docx = mergeContractTemplate(placeholders);
    checks.push({
      name: `[${slug}] DOCX oluştur`,
      ok: docx.length > 10_000,
      detail: `${docx.length} byte`,
    });
  } catch (e) {
    checks.push({
      name: `[${slug}] DOCX oluştur`,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    return { checks };
  }

  fs.writeFileSync(path.join(dir, `${slug}.docx`), docx);
  const xml = readDocxXml(docx);

  if (placeholders.deviceList.includes("\n\n")) {
    checks.push({
      name: `[${slug}] Cihazlar çok satırlı`,
      ok: xml.includes("Marka:") && xml.includes("Seri No:"),
      detail: "Satır satır format",
    });
  }

  if (placeholders.invoiceNumber === NO_INVOICE_TEXT) {
    checks.push({
      name: `[${slug}] Fatura yok metni`,
      ok: xml.includes(NO_INVOICE_TEXT),
      detail: NO_INVOICE_TEXT,
    });
  } else {
    checks.push({
      name: `[${slug}] Fatura numarası`,
      ok: xml.includes(placeholders.invoiceNumber),
      detail: placeholders.invoiceNumber,
    });
  }

  if (placeholders.contractAmount === "—") {
    checks.push({
      name: `[${slug}] Bedel boş`,
      ok: xml.includes("—"),
      detail: "—",
    });
  } else {
    checks.push({
      name: `[${slug}] Bedel dolu`,
      ok: xml.includes("12.000") || xml.includes(placeholders.contractAmount),
      detail: placeholders.contractAmount,
    });
  }

  checks.push({
    name: `[${slug}] İDARE tablosu`,
    ok: xml.includes("İDARE") && xml.includes("BBS TEKNOLOJİ"),
    detail: "2 sütunlu imza tablosu",
  });

  checks.push({
    name: `[${slug}] İDAREBBS birleşik metin yok`,
    ok: !xml.includes("İDAREBBS") && !xml.includes("MÜŞTERİ ADINA"),
    detail: "Tab ile birleşmiş imza yok",
  });

  let pdf: Buffer | undefined;
  try {
    pdf = await convertContractDocxToPdf(docx);
    fs.writeFileSync(path.join(dir, `${slug}.pdf`), pdf);
    const pageCount = (await PDFDocument.load(pdf)).getPageCount();
    checks.push({
      name: `[${slug}] PDF oluştur`,
      ok: pageCount > 1,
      detail: `${pageCount} sayfa, ${pdf.length} byte`,
    });
  } catch (e) {
    checks.push({
      name: `[${slug}] PDF oluştur`,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    return { checks, docx };
  }

  if (options.stamp && pdf && fs.existsSync(getBbsStampPath())) {
    try {
      const signed = await applyBbsStampToPdf(pdf);
      fs.writeFileSync(path.join(dir, `${slug}-imzali.pdf`), signed);
      checks.push({
        name: `[${slug}] İmzalı PDF (kaşe)`,
        ok: signed.length > 10_000,
        detail: `${signed.length} byte`,
      });
    } catch (e) {
      checks.push({
        name: `[${slug}] İmzalı PDF (kaşe)`,
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { checks, docx, pdf };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const checks: Check[] = [];

  const templatePath = getContractTemplatePath();
  checks.push({
    name: "Şablon dosyası mevcut",
    ok: fs.existsSync(templatePath),
    detail: templatePath,
  });

  const templateXml = readDocxXml(fs.readFileSync(templatePath));
  const phCount = (templateXml.match(/\{\{[^}]+\}\}/g) ?? []).length;
  checks.push({
    name: "Şablonda 13 placeholder",
    ok: phCount >= 13,
    detail: `${phCount} adet`,
  });

  checks.push({
    name: "Şablonda imza tablosu",
    ok: templateXml.includes("İDARE") && templateXml.includes("<w:tbl>"),
    detail: "2 sütunlu tablo",
  });

  const listFormat = formatDeviceList(device1);
  checks.push({
    name: "Cihaz listesi formatı",
    ok:
      listFormat.includes("1. Cihaz: HGW Start 15DF") &&
      listFormat.includes("   Marka: Tinax") &&
      listFormat.includes("\n\n") === false &&
      listFormat.includes("\n   Model:"),
    detail: listFormat.replace(/\n/g, " | "),
  });

  const scenarios: Array<{
    slug: string;
    placeholders: ContractTemplatePlaceholders;
    stamp?: boolean;
  }> = [
    {
      slug: "01-cihaz-1",
      placeholders: basePlaceholders({
        deviceList: formatDeviceList(device1),
      }),
    },
    {
      slug: "02-cihaz-5",
      placeholders: basePlaceholders({
        deviceList: formatDeviceList(device5),
      }),
    },
    {
      slug: "03-bedel-dolu",
      placeholders: basePlaceholders({
        contractAmount: "12.000,00 TL (KDV Hariç)",
      }),
    },
    {
      slug: "04-bedel-bos",
      placeholders: basePlaceholders({ contractAmount: "—" }),
    },
    {
      slug: "05-fatura-bagli",
      placeholders: basePlaceholders({
        invoiceNumber: "INV-2026-00125",
      }),
    },
    {
      slug: "06-fatura-yok",
      placeholders: basePlaceholders({
        invoiceNumber: NO_INVOICE_TEXT,
      }),
    },
    {
      slug: "07-imzasiz-taslak",
      placeholders: basePlaceholders({
        deviceList: formatDeviceList(device5),
      }),
    },
    {
      slug: "08-imzali",
      placeholders: basePlaceholders({
        deviceList: formatDeviceList(device5),
        invoiceNumber: "INV-2026-00125",
      }),
      stamp: true,
    },
  ];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario.slug, scenario.placeholders, {
      stamp: scenario.stamp,
    });
    checks.push(...result.checks);
  }

  if (!fs.existsSync(getBbsStampPath())) {
    checks.push({
      name: "Kaşe PNG (08-imzali için gerekli)",
      ok: false,
      detail: `Eksik: ${getBbsStampPath()}`,
    });
  }

  console.log("\n=== FAZ 3 EK Sözleşme Motoru Test Raporu ===\n");
  console.log(`Şablon: ${CONTRACT_TEMPLATE_RELATIVE_PATH}`);
  console.log(`Çıktı klasörü: ${OUT_DIR}`);
  console.log("\nManuel kontrol: Her alt klasördeki PDF dosyalarını açın.\n");

  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.name}`);
    console.log(`  ${c.detail}`);
  }

  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\nSonuç: ${checks.length - failed}/${checks.length} başarılı`);
  console.log(
    failed === 0
      ? "\nTüm otomatik kontroller geçti. PDF çıktılarını manuel inceleyin."
      : "\nBaşarısız kontroller var — PDF/DOCX dosyalarını inceleyin."
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

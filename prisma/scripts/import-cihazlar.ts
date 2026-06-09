/**
 * BBS CRM Birleşik Liste — "Cihazlar" sayfasından cihaz içe aktarır.
 *
 * npx ts-node prisma/scripts/import-cihazlar.ts "C:\path\BBS_CRM_Birlesik_Liste.xlsx"
 * npx tsx prisma/scripts/import-cihazlar.ts "C:\path\BBS_CRM_Birlesik_Liste.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "info@bbsteknoloji.com.tr";
const SHEET_NAME = "Cihazlar";
const IMPORT_SOURCE = "bbs_crm_birlesik_liste";
const LOGO_METADATA_KEY = "logoCustomerCode";

const color = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

type DeviceStatus = "ACTIVE" | "INACTIVE";

type CihazRow = {
  rowNumber: number;
  serialNumber: string;
  model: string | null;
  logoCustomerCode: string | null;
  customerName: string;
  location: string | null;
  warrantyExpiry: Date | null;
  status: DeviceStatus;
};

type ColumnLayout = {
  customerCode: number | null;
  customerName: number;
  location: number;
  warranty: number;
  status: number;
};

function resolveColumnLayout(headerRow: unknown[]): ColumnLayout {
  const headers = headerRow.map(cellToString).map((h) => h.toLowerCase());
  const codeIdx = headers.findIndex(
    (h) => h.includes("müşteri kodu") || h.includes("musteri kodu")
  );
  const nameIdx = headers.findIndex(
    (h) => h.includes("müşteri ünvan") || h.includes("musteri unvan") || h === "müşteri"
  );

  if (codeIdx >= 0 && nameIdx >= 0 && nameIdx > codeIdx) {
    return {
      customerCode: codeIdx,
      customerName: nameIdx,
      location: nameIdx + 1,
      warranty: nameIdx + 2,
      status: nameIdx + 3,
    };
  }

  if (nameIdx >= 0) {
    return {
      customerCode: null,
      customerName: nameIdx,
      location: nameIdx + 1,
      warranty: nameIdx + 2,
      status: nameIdx + 3,
    };
  }

  return {
    customerCode: null,
    customerName: 2,
    location: 3,
    warranty: 4,
    status: 5,
  };
}

type RowError = {
  rowNumber: number;
  message: string;
  serialNumber?: string;
  customerName?: string;
};

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}.${month}.${year}`;
  }
  return String(value).trim();
}

function formatDateTr(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function parseDateTr(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = cellToString(value);
  if (!raw) return null;

  const dotted = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]);
    const year = Number(dotted[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const numeric = Number(raw.replace(",", "."));
  if (Number.isFinite(numeric) && numeric > 1000) {
    return new Date((numeric - 25569) * 86400 * 1000);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readSheetMatrix(filePath: string, sheetName: string) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const availableSheets = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(
      `"${sheetName}" sayfası bulunamadı. Mevcut sayfalar: ${availableSheets.join(", ")}`
    );
  }
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];
  return matrix.map((cells, index) => ({ rowNumber: index + 1, cells }));
}

function isHeaderRow(cells: unknown[], markers: string[]): boolean {
  const joined = cells.map(cellToString).join(" ").toLowerCase();
  return markers.some((m) => joined.includes(m.toLowerCase()));
}

function pick(cells: unknown[], index: number): string {
  return cellToString(cells[index]);
}

function parseDeviceStatus(raw: string): DeviceStatus {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized === "kullanım dışı" || normalized === "kullanim disi"
    ? "INACTIVE"
    : "ACTIVE";
}

type CustomerCandidate = {
  id: string;
  legalName: string;
  tradeName: string | null;
};

const STOP_WORDS = new Set([
  "ve",
  "ile",
  "icin",
  "için",
  "the",
  "a",
  "an",
  "ltd",
  "sti",
  "şti",
  "san",
  "tic",
  "as",
  "aş",
  "acarlar",
]);

function normalizeForMatch(raw: string): string {
  let s = raw
    .toLocaleLowerCase("tr")
    .replace(/[''`´]/g, "")
    .replace(/\./g, " ")
    .replace(/[^a-z0-9ğüşıöçâîû ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const ordinals: Array<[RegExp, string]> = [
    [/beşinci|besinci/g, "5"],
    [/dördüncü|dorduncu/g, "4"],
    [/üçüncü|ucuncu/g, "3"],
    [/ikinci/g, "2"],
    [/birinci/g, "1"],
    [/altıncı|altinci/g, "6"],
    [/yedinci/g, "7"],
    [/sekizinci/g, "8"],
    [/dokuzuncu/g, "9"],
  ];
  for (const [re, rep] of ordinals) s = s.replace(re, rep);

  s = s
    .replace(/(\d+)\s*(?:uncu|inci|nci|ıncı|ncu)/g, "$1")
    .replace(/\bbşk\b/g, "başkanlığı")
    .replace(/\bmud\b/g, "müdürlüğü")
    .replace(/\bp\s*tugay\b/g, "piyade tugay")
    .replace(/\bpiyade tugay\b/g, "piyade tugay")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

function significantTokens(raw: string): string[] {
  return normalizeForMatch(raw)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function extractUnitNumber(raw: string): string | null {
  const m = normalizeForMatch(raw).match(/^(\d+)/);
  return m?.[1] ?? null;
}

function scoreNameMatch(deviceName: string, customerName: string): number {
  const devNorm = normalizeForMatch(deviceName);
  const custNorm = normalizeForMatch(customerName);

  if (devNorm === custNorm) return 1000;
  if (devNorm.includes(custNorm) || custNorm.includes(devNorm)) return 500;

  const devNum = extractUnitNumber(deviceName);
  const custNum = extractUnitNumber(customerName);
  if (devNum && custNum && devNum !== custNum) return 0;

  const a = new Set(significantTokens(deviceName));
  const b = new Set(significantTokens(customerName));
  let shared = 0;
  for (const t of a) {
    if (b.has(t)) shared += 1;
  }
  return shared;
}

async function loadCustomerCache(): Promise<CustomerCandidate[]> {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, legalName: true, tradeName: true },
  });
}

function findCustomerInCache(
  customerName: string,
  cache: CustomerCandidate[]
): { id: string; legalName: string } | null {
  const term = customerName.trim();
  if (term.length < 2) return null;

  const exact = cache.find(
    (c) =>
      c.legalName.toLocaleLowerCase("tr") === term.toLocaleLowerCase("tr") ||
      (c.tradeName &&
        c.tradeName.toLocaleLowerCase("tr") === term.toLocaleLowerCase("tr"))
  );
  if (exact) return { id: exact.id, legalName: exact.legalName };

  const scored = cache
    .map((c) => ({
      c,
      score: Math.max(
        scoreNameMatch(term, c.legalName),
        c.tradeName ? scoreNameMatch(term, c.tradeName) : 0
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0];
  const second = scored[1];

  if (best.score >= 500) {
    return { id: best.c.id, legalName: best.c.legalName };
  }

  if (
    best.score >= 3 &&
    (!second || best.score - second.score >= 1)
  ) {
    return { id: best.c.id, legalName: best.c.legalName };
  }

  return null;
}

async function findCustomerByCode(
  logoCustomerCode: string
): Promise<{ id: string; legalName: string } | null> {
  const code = logoCustomerCode.trim();
  if (!code) return null;

  return prisma.customer.findFirst({
    where: {
      deletedAt: null,
      metadata: { path: [LOGO_METADATA_KEY], equals: code },
    },
    select: { id: true, legalName: true },
  });
}

async function findCustomer(
  logoCustomerCode: string | null,
  customerName: string,
  cache: CustomerCandidate[]
): Promise<{ id: string; legalName: string } | null> {
  if (logoCustomerCode) {
    const byCode = await findCustomerByCode(logoCustomerCode);
    if (byCode) return byCode;
  }
  return findCustomerInCache(customerName, cache);
}

function mapCihazRow(
  cells: unknown[],
  rowNumber: number,
  layout: ColumnLayout
): { ok: true; data: CihazRow } | { ok: false; error: string } {
  const serialNumber = pick(cells, 0);
  if (!serialNumber) {
    return { ok: false, error: "Seri numarası boş" };
  }

  const logoCustomerCode =
    layout.customerCode != null ? pick(cells, layout.customerCode) || null : null;
  const customerName = pick(cells, layout.customerName);
  if (customerName.length < 2) {
    return { ok: false, error: "Müşteri ünvanı boş veya geçersiz" };
  }

  return {
    ok: true,
    data: {
      rowNumber,
      serialNumber,
      model: pick(cells, 1) || null,
      logoCustomerCode,
      customerName,
      location: pick(cells, layout.location) || null,
      warrantyExpiry: parseDateTr(cells[layout.warranty]),
      status: parseDeviceStatus(pick(cells, layout.status)),
    },
  };
}

function buildDeviceName(model: string | null, serialNumber: string): string {
  const trimmedModel = model?.trim();
  if (trimmedModel) return trimmedModel.slice(0, 255);
  return `Cihaz ${serialNumber}`.slice(0, 255);
}

function buildNotes(row: CihazRow, customerMatched: boolean): string {
  const lines: string[] = [`Kaynak: ${IMPORT_SOURCE}`];

  if (!customerMatched) {
    lines.push(`Eşleşmeyen müşteri (import): ${row.customerName}`);
  }
  if (row.location) {
    lines.push(`Konum / Açıklama: ${row.location}`);
  }
  if (row.warrantyExpiry) {
    lines.push(`Hizmet Sonu (warrantyExpiry): ${formatDateTr(row.warrantyExpiry)}`);
  }
  lines.push(`Durum: ${row.status === "INACTIVE" ? "Kullanım Dışı" : "Aktif"}`);

  return lines.join("\n").slice(0, 5000);
}

async function upsertDevice(
  userId: string,
  customerId: string | null,
  row: CihazRow,
  customerMatched: boolean
): Promise<"created" | "updated"> {
  const brand = row.model?.slice(0, 100) ?? null;
  const model = row.model?.slice(0, 100) ?? null;
  const notes = buildNotes(row, customerMatched);
  const deviceName = buildDeviceName(row.model, row.serialNumber);
  const existing = await prisma.customerDevice.findFirst({
    where: {
      serialNumber: { equals: row.serialNumber, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, deletedAt: true },
  });

  const data = {
    customerId,
    deviceName,
    brand,
    model,
    serialNumber: row.serialNumber.slice(0, 100),
    notes,
    // Excel "Kullanım Dışı" operasyonel durumdur; soft-delete (deletedAt) kullanılmaz.
    deletedAt: existing?.deletedAt ?? null,
    updatedById: userId,
  };

  if (existing) {
    await prisma.customerDevice.update({
      where: { id: existing.id },
      data,
    });
    return "updated";
  }

  await prisma.customerDevice.create({
    data: { ...data, createdById: userId },
  });
  return "created";
}

async function resolveImportUserId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL.toLowerCase(), deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  });
  if (admin) return admin.id;

  const fallback = await prisma.user.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!fallback) {
    throw new Error("Aktif kullanıcı bulunamadı — import için en az bir kullanıcı gerekli");
  }
  return fallback.id;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      color.red(
        'Kullanım: npx ts-node prisma/scripts/import-cihazlar.ts "C:\\path\\BBS_CRM_Birlesik_Liste.xlsx"'
      )
    );
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(color.red(`Dosya bulunamadı: ${absolutePath}`));
    process.exit(1);
  }

  console.log(color.bold("=== BBS CRM Cihaz İçe Aktarma ===\n"));
  console.log(`Dosya: ${absolutePath}`);
  console.log(`Sayfa: ${SHEET_NAME}\n`);

  const allRows = readSheetMatrix(absolutePath, SHEET_NAME);
  const headerRow = allRows.find((row) =>
    isHeaderRow(row.cells, ["seri no", "müşteri", "model"])
  );
  const layout = resolveColumnLayout(headerRow?.cells ?? []);

  const dataRows = allRows.filter((row) => {
    const hasData = row.cells.some((c) => cellToString(c).length > 0);
    if (!hasData) return false;
    if (isHeaderRow(row.cells, ["seri no", "müşteri", "model"])) return false;
    return true;
  });

  const userId = await resolveImportUserId();
  const customerCache = await loadCustomerCache();

  let matched = 0;
  let created = 0;
  let updated = 0;
  let unmatched = 0;
  let failed = 0;

  const errors: RowError[] = [];
  const unmatchedCustomerNames = new Set<string>();

  console.log(`Toplam satır: ${dataRows.length}\n`);

  for (const { cells, rowNumber } of dataRows) {
    const mapped = mapCihazRow(cells, rowNumber, layout);

    if (!mapped.ok) {
      failed += 1;
      errors.push({
        rowNumber,
        message: mapped.error,
        serialNumber: pick(cells, 0) || undefined,
        customerName: pick(cells, layout.customerName) || undefined,
      });
      continue;
    }

    const row = mapped.data;

    try {
      const customer = await findCustomer(
        row.logoCustomerCode,
        row.customerName,
        customerCache
      );
      const customerMatched = customer != null;

      if (!customerMatched) {
        unmatched += 1;
        unmatchedCustomerNames.add(row.customerName);
        console.log(
          color.yellow(
            `  [EŞLEŞMEDİ] Satır ${row.rowNumber} — müşteri bulunamadı, customerId=null: "${row.customerName}" (Seri: ${row.serialNumber})`
          )
        );
      }

      const action = await upsertDevice(userId, customer?.id ?? null, row, customerMatched);
      if (customerMatched) matched += 1;
      if (action === "created") created += 1;
      else updated += 1;
    } catch (e) {
      failed += 1;
      let message = "Kayıt işlenemedi";
      if (e instanceof Error) {
        message = e.message.includes("Unique constraint")
          ? "Seri numarası çakışması"
          : e.message;
      }
      errors.push({
        rowNumber: row.rowNumber,
        serialNumber: row.serialNumber,
        customerName: row.customerName,
        message,
      });
    }
  }

  console.log(color.bold("\n--- Sonuç ---"));
  console.log(`Toplam:       ${dataRows.length}`);
  console.log(
    matched > 0
      ? color.green(`Eşleşti:      ${matched} (${created} yeni, ${updated} güncelleme)`)
      : `Eşleşti:      ${matched}`
  );
  console.log(
    unmatched > 0
      ? color.yellow(`Eşleşmedi:    ${unmatched} (customerId=null olarak kaydedildi)`)
      : color.green(`Eşleşmedi:    ${unmatched}`)
  );
  console.log(failed > 0 ? color.red(`Hata:         ${failed}`) : color.green(`Hata:         ${failed}`));

  if (unmatchedCustomerNames.size > 0) {
    console.log(color.yellow("\n--- Eşleşmeyen müşteri adları (manuel eşleştirme) ---"));
    const sorted = [...unmatchedCustomerNames].sort((a, b) => a.localeCompare(b, "tr"));
    for (const name of sorted) {
      console.log(color.yellow(`  - ${name}`));
    }
  }

  if (errors.length > 0) {
    console.log(color.red("\n--- Hatalar (ilk 20) ---"));
    for (const err of errors.slice(0, 20)) {
      const ref = [err.serialNumber, err.customerName].filter(Boolean).join(" | ");
      console.log(color.red(`  Satır ${err.rowNumber}${ref ? ` (${ref})` : ""}: ${err.message}`));
    }
    if (errors.length > 20) {
      console.log(color.dim(`  ... ve ${errors.length - 20} hata daha`));
    }
  }

  console.log(color.green("\nİçe aktarma tamamlandı."));
}

main()
  .catch((error) => {
    console.error(color.red("\nHata:"), error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

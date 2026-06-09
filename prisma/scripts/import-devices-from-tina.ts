/**
 * Tina destek paketleri Excel dosyasından müşteri cihazlarını içe aktarır.
 *
 * npx ts-node prisma/scripts/import-devices-from-tina.ts "C:\path\TinaxDestekPaketleri__1_.xlsx"
 * npx tsx prisma/scripts/import-devices-from-tina.ts "C:\path\TinaxDestekPaketleri__1_.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "info@bbsteknoloji.com.tr";
const IMPORT_SOURCE = "tina_destek_paketleri";

const TINA_HEADERS = {
  serialNumber: "Seri No",
  model: "Model",
  customer: "Müşteri",
  dealer: "Bayi",
  description: "Açıklama",
  serviceEnd: "Hizmet Sonu",
  lastAccess: "Son Erişim",
  status: "Durum",
} as const;

type DeviceStatus = "ACTIVE" | "INACTIVE";

type TinaRow = {
  rowNumber: number;
  serialNumber: string;
  model: string | null;
  customerName: string;
  dealer: string | null;
  description: string | null;
  serviceEnd: Date | null;
  lastAccess: Date | null;
  status: DeviceStatus;
};

type RowError = {
  rowNumber: number;
  message: string;
  serialNumber?: string;
  customerName?: string;
};

type RawSpreadsheetRow = {
  rowNumber: number;
  strings: Record<string, string>;
  raw: Record<string, unknown>;
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function formatDateTr(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function parseExcelDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date((value - 25569) * 86400 * 1000);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const numeric = Number(raw.replace(",", "."));
  if (Number.isFinite(numeric) && numeric > 1000) {
    return new Date((numeric - 25569) * 86400 * 1000);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDeviceStatus(raw: string): DeviceStatus {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "");
  return normalized === "KULLANIMDISI" ? "INACTIVE" : "ACTIVE";
}

function readSpreadsheet(filePath: string): RawSpreadsheetRow[] {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    let text = buffer.toString("utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const delimiter = ext === ".tsv" || text.includes("\t") ? "\t" : ";";
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line, index) => {
      const cells = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
      const strings: Record<string, string> = {};
      const raw: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        if (!h) return;
        const cell = cells[i] ?? "";
        strings[h] = cell;
        raw[h] = cell;
      });
      return { rowNumber: index + 2, strings, raw };
    });
  }

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];

  if (matrix.length < 2) return [];

  const headers = (matrix[0] ?? []).map((h) => cellToString(h));
  return matrix.slice(1).map((cells, index) => {
    const strings: Record<string, string> = {};
    const raw: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (!h) return;
      const cell = cells[i];
      raw[h] = cell;
      strings[h] = cellToString(cell);
    });
    return { rowNumber: index + 2, strings, raw };
  });
}

function resolveHeaderKey(
  row: Record<string, string>,
  expected: string
): string | null {
  if (expected in row) return expected;
  const target = normalizeHeader(expected);
  const match = Object.keys(row).find((k) => normalizeHeader(k) === target);
  return match ?? null;
}

function pickString(row: Record<string, string>, key: keyof typeof TINA_HEADERS): string {
  const header = TINA_HEADERS[key];
  const resolved = resolveHeaderKey(row, header);
  return resolved ? (row[resolved] ?? "").trim() : "";
}

function pickRaw(raw: Record<string, unknown>, strings: Record<string, string>, key: keyof typeof TINA_HEADERS): unknown {
  const header = TINA_HEADERS[key];
  const resolved = resolveHeaderKey(strings, header);
  return resolved ? raw[resolved] : undefined;
}

function mapTinaRow(
  raw: RawSpreadsheetRow
): { ok: true; data: TinaRow } | { ok: false; error: string } {
  const serialNumber = pickString(raw.strings, "serialNumber");
  if (!serialNumber) {
    return { ok: false, error: "Seri numarası boş" };
  }

  const customerName = pickString(raw.strings, "customer");
  if (customerName.length < 2) {
    return { ok: false, error: "Müşteri adı boş veya geçersiz" };
  }

  const model = pickString(raw.strings, "model") || null;
  const dealer = pickString(raw.strings, "dealer") || null;
  const description = pickString(raw.strings, "description") || null;

  return {
    ok: true,
    data: {
      rowNumber: raw.rowNumber,
      serialNumber,
      model,
      customerName,
      dealer,
      description,
      serviceEnd: parseExcelDate(pickRaw(raw.raw, raw.strings, "serviceEnd")),
      lastAccess: parseExcelDate(pickRaw(raw.raw, raw.strings, "lastAccess")),
      status: parseDeviceStatus(pickString(raw.strings, "status")),
    },
  };
}

function buildDeviceName(model: string | null, serialNumber: string): string {
  const trimmedModel = model?.trim();
  if (trimmedModel) return trimmedModel.slice(0, 255);
  return `Cihaz ${serialNumber}`.slice(0, 255);
}

function buildNotes(row: TinaRow): string {
  const lines: string[] = [`Kaynak: ${IMPORT_SOURCE}`];

  if (row.description) {
    lines.push(`Konum / Açıklama: ${row.description}`);
  }
  if (row.dealer) {
    lines.push(`Bayi: ${row.dealer}`);
  }
  if (row.serviceEnd) {
    lines.push(`Hizmet Sonu: ${formatDateTr(row.serviceEnd)}`);
  }
  if (row.lastAccess) {
    lines.push(`Son Erişim: ${formatDateTr(row.lastAccess)}`);
  }
  lines.push(`Durum: ${row.status === "INACTIVE" ? "KULLANIMDISI" : "AKTIF"}`);

  return lines.join("\n").slice(0, 5000);
}

function scoreCustomerMatch(
  customerName: string,
  customer: { legalName: string; tradeName: string | null }
): number {
  const term = customerName.trim().toLowerCase();
  const legal = customer.legalName.trim().toLowerCase();
  const trade = (customer.tradeName ?? "").trim().toLowerCase();

  if (legal === term) return 100;
  if (trade && trade === term) return 95;
  if (legal.includes(term)) return 80;
  if (trade && trade.includes(term)) return 75;
  if (term.includes(legal) && legal.length >= 4) return 70;
  if (trade && term.includes(trade) && trade.length >= 4) return 65;

  return 0;
}

async function findCustomerByName(
  tx: Prisma.TransactionClient,
  customerName: string
): Promise<{ id: string; legalName: string } | null> {
  const term = customerName.trim();
  if (term.length < 2) return null;

  const candidates = await tx.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { legalName: { contains: term, mode: "insensitive" } },
        { tradeName: { contains: term, mode: "insensitive" } },
      ],
    },
    select: { id: true, legalName: true, tradeName: true },
    take: 25,
  });

  if (candidates.length === 0) {
    const reverseMatches = await tx.$queryRaw<
      Array<{ id: string; legal_name: string; trade_name: string | null }>
    >`
      SELECT id, legal_name, trade_name
      FROM customers
      WHERE deleted_at IS NULL
        AND (
          ${term} ILIKE '%' || legal_name || '%'
          OR (${term} ILIKE '%' || COALESCE(trade_name, '') || '%' AND trade_name IS NOT NULL)
        )
      LIMIT 25
    `;

    if (reverseMatches.length === 0) return null;

    const scored = reverseMatches
      .map((c) => ({
        id: c.id,
        legalName: c.legal_name,
        tradeName: c.trade_name,
        score: scoreCustomerMatch(term, {
          legalName: c.legal_name,
          tradeName: c.trade_name,
        }),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;
    return { id: scored[0].id, legalName: scored[0].legalName };
  }

  if (candidates.length === 1) {
    return { id: candidates[0].id, legalName: candidates[0].legalName };
  }

  const scored = candidates
    .map((c) => ({
      ...c,
      score: scoreCustomerMatch(term, c),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.legalName.length - b.legalName.length);

  if (scored.length === 0) return null;
  return { id: scored[0].id, legalName: scored[0].legalName };
}

async function upsertDevice(
  tx: Prisma.TransactionClient,
  userId: string,
  customerId: string,
  row: TinaRow
): Promise<"created" | "updated"> {
  const brand = row.model?.slice(0, 100) ?? null;
  const model = row.model?.slice(0, 100) ?? null;
  const notes = buildNotes(row);
  const deviceName = buildDeviceName(row.model, row.serialNumber);
  const deletedAt = row.status === "INACTIVE" ? new Date() : null;

  const existing = await tx.customerDevice.findFirst({
    where: {
      serialNumber: { equals: row.serialNumber, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  const data = {
    customerId,
    deviceName,
    brand,
    model,
    serialNumber: row.serialNumber.slice(0, 100),
    notes,
    deletedAt,
    updatedById: userId,
  };

  if (existing) {
    await tx.customerDevice.update({
      where: { id: existing.id },
      data,
    });
    return "updated";
  }

  await tx.customerDevice.create({
    data: {
      ...data,
      createdById: userId,
    },
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
      'Kullanım: npx ts-node prisma/scripts/import-devices-from-tina.ts "C:\\path\\TinaxDestekPaketleri__1_.xlsx"'
    );
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Dosya bulunamadı: ${absolutePath}`);
    process.exit(1);
  }

  console.log("=== Tina Cihaz İçe Aktarma ===\n");
  console.log(`Dosya: ${absolutePath}\n`);

  const rawRows = readSpreadsheet(absolutePath).filter((row) =>
    Object.entries(row.strings).some(([, v]) => v.trim().length > 0)
  );

  const userId = await resolveImportUserId();

  let matched = 0;
  let created = 0;
  let updated = 0;
  let unmatched = 0;
  let failed = 0;

  const errors: RowError[] = [];
  const unmatchedCustomerNames = new Set<string>();

  console.log(`Toplam satır: ${rawRows.length}\n`);

  for (const raw of rawRows) {
    const mapped = mapTinaRow(raw);

    if (!mapped.ok) {
      failed += 1;
      errors.push({
        rowNumber: raw.rowNumber,
        message: mapped.error,
        serialNumber: pickString(raw.strings, "serialNumber") || undefined,
        customerName: pickString(raw.strings, "customer") || undefined,
      });
      continue;
    }

    const row = mapped.data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const customer = await findCustomerByName(tx, row.customerName);
        if (!customer) {
          return { type: "unmatched" as const };
        }

        const action = await upsertDevice(tx, userId, customer.id, row);
        return { type: "matched" as const, action };
      });

      if (result.type === "unmatched") {
        unmatched += 1;
        unmatchedCustomerNames.add(row.customerName);
        console.log(
          `  [ATLANDI] Satır ${row.rowNumber} — müşteri bulunamadı: "${row.customerName}" (Seri: ${row.serialNumber})`
        );
        continue;
      }

      matched += 1;
      if (result.action === "created") created += 1;
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

  console.log("\n--- Sonuç ---");
  console.log(`Toplam:       ${rawRows.length}`);
  console.log(`Eşleşti:      ${matched} (${created} yeni, ${updated} güncelleme)`);
  console.log(`Eşleşmedi:    ${unmatched}`);
  console.log(`Hata:         ${failed}`);

  if (unmatchedCustomerNames.size > 0) {
    console.log("\n--- Eşleşmeyen müşteri adları (manuel eşleştirme) ---");
    const sorted = [...unmatchedCustomerNames].sort((a, b) =>
      a.localeCompare(b, "tr")
    );
    for (const name of sorted) {
      console.log(`  - ${name}`);
    }
  }

  if (errors.length > 0) {
    console.log("\n--- Hatalar (ilk 20) ---");
    for (const err of errors.slice(0, 20)) {
      const ref = [err.serialNumber, err.customerName].filter(Boolean).join(" | ");
      console.log(`  Satır ${err.rowNumber}${ref ? ` (${ref})` : ""}: ${err.message}`);
    }
    if (errors.length > 20) {
      console.log(`  ... ve ${errors.length - 20} hata daha`);
    }
  }

  console.log("\nİçe aktarma tamamlandı.");
}

main()
  .catch((error) => {
    console.error("\nHata:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

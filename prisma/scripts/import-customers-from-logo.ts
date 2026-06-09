/**
 * Logo yazılımından export edilmiş müşteri Excel/TSV dosyasını içe aktarır.
 *
 * npx ts-node prisma/scripts/import-customers-from-logo.ts "C:\path\Müşteriler.xlsx"
 * npx tsx prisma/scripts/import-customers-from-logo.ts "C:\path\Müşteriler.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { CustomerStatus, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** CRM metadata anahtarları — logo-customer-fields ile uyumlu */
const LOGO_METADATA_KEY = "logoCustomerCode";
const LOGO_IMPORT_SOURCE = "logo_isbasi";

const ADMIN_EMAIL = "info@bbsteknoloji.com.tr";

/** Logo export sütun başlıkları */
const LOGO_HEADERS = {
  code: "Müşteri Kodu",
  type: "Tipi",
  active: "Müşteri Aktif/Pasif",
  legalName: "Müşteri Ünvanı",
  screenName: "Müşteri Ekran Adı",
  listName: "Müşteri Liste Adı",
  country: "Ülke",
  city: "Şehir",
  district: "İlçe",
  address: "Adres",
  phone: "Telefon",
  taxId: "Müşteri Vkn-Tckn",
  taxOffice: "Vergi Dairesi",
  category: "Kategori",
  description: "Açıklama",
  email: "E Posta",
} as const;

type CustomerTypeMeta = "INDIVIDUAL" | "CORPORATE";

type LogoRow = {
  rowNumber: number;
  code: string | null;
  type: CustomerTypeMeta;
  status: CustomerStatus;
  legalName: string;
  tradeName: string | null;
  country: string;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  taxId: string;
  taxOffice: string | null;
  category: string | null;
  description: string | null;
  email: string | null;
};

type RowError = { rowNumber: number; message: string; code?: string; name?: string };

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

function normalizeTaxId(raw: string): string {
  return raw.replace(/\D/g, "");
}

function parseCustomerType(raw: string): CustomerTypeMeta {
  const v = raw.trim();
  if (v === "1" || /bireysel/i.test(v)) return "INDIVIDUAL";
  if (v === "2" || /kurumsal/i.test(v)) return "CORPORATE";
  return /^\d/.test(v) && v.startsWith("1") ? "INDIVIDUAL" : "CORPORATE";
}

function parseCustomerStatus(raw: string): CustomerStatus {
  return raw.trim().toLowerCase() === "aktif" ? "ACTIVE" : "INACTIVE";
}

function mapCountry(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v.includes("turk") || v === "tr") return "TR";
  if (v.length === 2) return v.toUpperCase();
  return "TR";
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function readSpreadsheet(filePath: string): Record<string, string>[] {
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
      const row: Record<string, string> = { __rowNumber: String(index + 2) };
      headers.forEach((h, i) => {
        row[h] = cells[i] ?? "";
      });
      return row;
    });
  }

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (matrix.length < 2) return [];

  const headers = (matrix[0] ?? []).map((h) => cellToString(h));
  return matrix.slice(1).map((cells, index) => {
    const row: Record<string, string> = { __rowNumber: String(index + 2) };
    headers.forEach((h, i) => {
      if (h) row[h] = cellToString(cells[i]);
    });
    return row;
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

function pick(row: Record<string, string>, key: keyof typeof LOGO_HEADERS): string {
  const header = LOGO_HEADERS[key];
  const resolved = resolveHeaderKey(row, header);
  return resolved ? (row[resolved] ?? "").trim() : "";
}

function mapLogoRow(
  raw: Record<string, string>,
  rowNumber: number
): { ok: true; data: LogoRow } | { ok: false; error: string } {
  const legalName = pick(raw, "legalName");
  if (legalName.length < 2) {
    return { ok: false, error: "Müşteri ünvanı boş veya geçersiz" };
  }

  const taxId = normalizeTaxId(pick(raw, "taxId"));
  if (taxId.length < 10 || taxId.length > 11) {
    return { ok: false, error: "VKN/TCKN 10-11 hane olmalı" };
  }

  const emailRaw = pick(raw, "email");
  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;

  const code = pick(raw, "code") || null;
  const screenName = pick(raw, "screenName") || null;
  const listName = pick(raw, "listName") || null;

  return {
    ok: true,
    data: {
      rowNumber,
      code,
      type: parseCustomerType(pick(raw, "type")),
      status: parseCustomerStatus(pick(raw, "active")),
      legalName,
      tradeName: screenName || listName || null,
      country: mapCountry(pick(raw, "country") || "Türkiye"),
      city: pick(raw, "city") || null,
      district: pick(raw, "district") || null,
      address: pick(raw, "address") || null,
      phone: pick(raw, "phone") || null,
      taxId,
      taxOffice: pick(raw, "taxOffice") || null,
      category: pick(raw, "category") || null,
      description: pick(raw, "description") || null,
      email,
    },
  };
}

function buildMetadata(
  row: LogoRow,
  existing?: Prisma.JsonValue | null
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return {
    ...base,
    ...(row.code ? { [LOGO_METADATA_KEY]: row.code } : {}),
    customerType: row.type,
    importSource: LOGO_IMPORT_SOURCE,
    category: row.category,
    lastImportedAt: new Date().toISOString(),
  };
}

async function findExistingCustomer(
  tx: Prisma.TransactionClient,
  row: LogoRow
) {
  if (row.code) {
    const byCode = await tx.customer.findFirst({
      where: {
        deletedAt: null,
        metadata: { path: [LOGO_METADATA_KEY], equals: row.code },
      },
      select: { id: true, metadata: true, taxNumber: true, legalName: true },
    });
    if (byCode) return byCode;
  }

  const byName = await tx.customer.findFirst({
    where: {
      deletedAt: null,
      legalName: { equals: row.legalName, mode: "insensitive" },
    },
    select: { id: true, metadata: true, taxNumber: true, legalName: true },
  });
  if (byName) return byName;

  return tx.customer.findFirst({
    where: { deletedAt: null, taxNumber: row.taxId },
    select: { id: true, metadata: true, taxNumber: true, legalName: true },
  });
}

async function upsertPrimaryAddress(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: LogoRow,
  userId: string
) {
  const line1 = (row.address?.trim() || "Adres belirtilmedi").slice(0, 255);
  const city = (row.city?.trim() || "Belirtilmedi").slice(0, 100);
  const district = row.district?.trim().slice(0, 100) || null;

  const primary = await tx.customerAddress.findFirst({
    where: { customerId, deletedAt: null, isPrimary: true },
    select: { id: true },
  });

  const data = {
    line1,
    city,
    district,
    country: row.country,
    updatedById: userId,
  };

  if (primary) {
    await tx.customerAddress.update({ where: { id: primary.id }, data });
    return;
  }

  await tx.customerAddress.create({
    data: {
      customerId,
      ...data,
      isPrimary: true,
      createdById: userId,
    },
  });
}

async function upsertPrimaryContact(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: LogoRow,
  userId: string
) {
  const fullName = row.legalName.slice(0, 200);
  const phone = row.phone?.slice(0, 30) || null;
  const email = row.email?.slice(0, 255) || null;

  if (!phone && !email) return;

  const primary = await tx.customerContact.findFirst({
    where: { customerId, deletedAt: null, isPrimary: true },
    select: { id: true },
  });

  if (primary) {
    await tx.customerContact.update({
      where: { id: primary.id },
      data: { fullName, phone, email, updatedById: userId },
    });
    return;
  }

  await tx.customerContact.create({
    data: {
      customerId,
      fullName,
      phone,
      email,
      isPrimary: true,
      createdById: userId,
    },
  });
}

async function importRow(
  tx: Prisma.TransactionClient,
  userId: string,
  row: LogoRow
): Promise<"created" | "updated"> {
  const existing = await findExistingCustomer(tx, row);

  const customerData = {
    legalName: row.legalName,
    tradeName: row.tradeName,
    taxNumber: row.taxId,
    taxOffice: row.taxOffice,
    status: row.status,
    notes: row.description,
    metadata: buildMetadata(row, existing?.metadata),
    updatedById: userId,
  };

  if (existing) {
    await tx.customer.update({
      where: { id: existing.id },
      data: customerData,
    });
    await upsertPrimaryAddress(tx, existing.id, row, userId);
    await upsertPrimaryContact(tx, existing.id, row, userId);
    return "updated";
  }

  const created = await tx.customer.create({
    data: {
      ...customerData,
      assignedToId: userId,
      createdById: userId,
    },
    select: { id: true },
  });

  await upsertPrimaryAddress(tx, created.id, row, userId);
  await upsertPrimaryContact(tx, created.id, row, userId);
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
      'Kullanım: npx ts-node prisma/scripts/import-customers-from-logo.ts "C:\\path\\Müşteriler.xlsx"'
    );
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Dosya bulunamadı: ${absolutePath}`);
    process.exit(1);
  }

  console.log("=== Logo Müşteri İçe Aktarma ===\n");
  console.log(`Dosya: ${absolutePath}\n`);

  const rawRows = readSpreadsheet(absolutePath).filter((row) =>
    Object.entries(row).some(
      ([k, v]) => k !== "__rowNumber" && v.trim().length > 0
    )
  );

  const userId = await resolveImportUserId();
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: RowError[] = [];

  console.log(`Toplam satır: ${rawRows.length}\n`);

  for (const raw of rawRows) {
    const rowNumber = Number(raw.__rowNumber) || 0;
    const mapped = mapLogoRow(raw, rowNumber);

    if (!mapped.ok) {
      failed += 1;
      errors.push({
        rowNumber,
        message: mapped.error,
        code: pick(raw, "code") || undefined,
        name: pick(raw, "legalName") || undefined,
      });
      continue;
    }

    try {
      const action = await prisma.$transaction((tx) =>
        importRow(tx, userId, mapped.data)
      );
      if (action === "created") created += 1;
      else updated += 1;
    } catch (e) {
      failed += 1;
      let message = "Kayıt işlenemedi";
      if (e instanceof Error) {
        message = e.message.includes("Unique constraint")
          ? "Vergi numarası veya ünvan başka kayıtta mevcut"
          : e.message;
      }
      errors.push({
        rowNumber: mapped.data.rowNumber,
        code: mapped.data.code ?? undefined,
        name: mapped.data.legalName,
        message,
      });
    }
  }

  const successful = created + updated;

  console.log("--- Sonuç ---");
  console.log(`Toplam:     ${rawRows.length}`);
  console.log(`Başarılı:   ${successful} (${created} yeni, ${updated} güncelleme)`);
  console.log(`Hatalı:     ${failed}`);

  if (errors.length > 0) {
    console.log("\n--- Hatalar (ilk 20) ---");
    for (const err of errors.slice(0, 20)) {
      const ref = [err.code, err.name].filter(Boolean).join(" | ");
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

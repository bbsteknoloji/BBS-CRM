/**
 * BBS CRM Birleşik Liste — "Müşteriler" sayfasından müşteri içe aktarır.
 *
 * npx ts-node prisma/scripts/import-musteriler.ts "C:\path\BBS_CRM_Birlesik_Liste.xlsx"
 * npx tsx prisma/scripts/import-musteriler.ts "C:\path\BBS_CRM_Birlesik_Liste.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { CustomerStatus, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "info@bbsteknoloji.com.tr";
const LOGO_METADATA_KEY = "logoCustomerCode";
const SHEET_NAME = "Müşteriler";
const IMPORT_SOURCE = "bbs_crm_birlesik_liste";

const color = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

type CustomerTypeMeta = "INDIVIDUAL" | "CORPORATE";

type MusteriRow = {
  rowNumber: number;
  logoCustomerCode: string | null;
  type: CustomerTypeMeta;
  status: CustomerStatus;
  legalName: string;
  country: string;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  taxNumber: string;
  taxOffice: string | null;
  email: string | null;
};

type RowError = {
  rowNumber: number;
  message: string;
  code?: string;
  name?: string;
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

function normalizeTaxId(raw: string): string {
  return raw.replace(/\D/g, "");
}

function mapCountry(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v.includes("turk") || v === "tr" || v === "türkiye") return "TR";
  if (v.length === 2) return v.toUpperCase();
  return "TR";
}

function syntheticTaxNumber(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const num = (Math.abs(hash) % 9000000000) + 1000000000;
  return String(num);
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

function parseCustomerType(raw: string): CustomerTypeMeta {
  const v = raw.trim().toLowerCase();
  if (v.includes("bireysel")) return "INDIVIDUAL";
  if (v.includes("kurumsal")) return "CORPORATE";
  return "CORPORATE";
}

function parseStatus(raw: string): CustomerStatus {
  return raw.trim().toLowerCase() === "aktif" ? "ACTIVE" : "INACTIVE";
}

function resolveTaxNumber(raw: string, logoCode: string | null, legalName: string): string {
  const normalized = normalizeTaxId(raw);
  if (normalized.length >= 10 && normalized.length <= 11) return normalized;

  if (logoCode) {
    const digits = normalizeTaxId(logoCode);
    if (digits.length >= 6) {
      const padded = `9${digits.slice(-9).padStart(9, "0")}`.slice(0, 11);
      if (padded.length >= 10) return padded;
    }
  }

  return syntheticTaxNumber(legalName);
}

function mapMusteriRow(
  cells: unknown[],
  rowNumber: number
): { ok: true; data: MusteriRow } | { ok: false; error: string } {
  const logoCustomerCode = pick(cells, 0) || null;
  const legalName = pick(cells, 3);

  if (legalName.length < 2) {
    return { ok: false, error: "Müşteri ünvanı boş veya geçersiz" };
  }

  const emailRaw = pick(cells, 11);
  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;

  return {
    ok: true,
    data: {
      rowNumber,
      logoCustomerCode,
      type: parseCustomerType(pick(cells, 1)),
      status: parseStatus(pick(cells, 2)),
      legalName,
      country: mapCountry(pick(cells, 4) || "Türkiye"),
      city: pick(cells, 5) || null,
      district: pick(cells, 6) || null,
      address: pick(cells, 7) || null,
      phone: pick(cells, 8) || null,
      taxNumber: resolveTaxNumber(pick(cells, 9), logoCustomerCode, legalName),
      taxOffice: pick(cells, 10) || null,
      email,
    },
  };
}

function buildMetadata(
  row: MusteriRow,
  existing?: Prisma.JsonValue | null
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return {
    ...base,
    ...(row.logoCustomerCode ? { [LOGO_METADATA_KEY]: row.logoCustomerCode } : {}),
    customerType: row.type,
    importSource: IMPORT_SOURCE,
    lastImportedAt: new Date().toISOString(),
  };
}

async function findExistingCustomer(tx: Prisma.TransactionClient, row: MusteriRow) {
  if (row.logoCustomerCode) {
    const byCode = await tx.customer.findFirst({
      where: {
        deletedAt: null,
        metadata: { path: [LOGO_METADATA_KEY], equals: row.logoCustomerCode },
      },
      select: { id: true, metadata: true, taxNumber: true, legalName: true },
    });
    if (byCode) return byCode;
  }

  return tx.customer.findFirst({
    where: {
      deletedAt: null,
      legalName: { equals: row.legalName, mode: "insensitive" },
    },
    select: { id: true, metadata: true, taxNumber: true, legalName: true },
  });
}

async function upsertPrimaryAddress(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: MusteriRow,
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
    data: { customerId, ...data, isPrimary: true, createdById: userId },
  });
}

async function upsertPrimaryContact(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: MusteriRow,
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
  row: MusteriRow
): Promise<"created" | "updated"> {
  const existing = await findExistingCustomer(tx, row);

  const customerData = {
    legalName: row.legalName,
    taxNumber: row.taxNumber,
    taxOffice: row.taxOffice,
    status: row.status,
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
      color.red(
        'Kullanım: npx ts-node prisma/scripts/import-musteriler.ts "C:\\path\\BBS_CRM_Birlesik_Liste.xlsx"'
      )
    );
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(color.red(`Dosya bulunamadı: ${absolutePath}`));
    process.exit(1);
  }

  console.log(color.bold("=== BBS CRM Müşteri İçe Aktarma ===\n"));
  console.log(`Dosya: ${absolutePath}`);
  console.log(`Sayfa: ${SHEET_NAME}\n`);

  const allRows = readSheetMatrix(absolutePath, SHEET_NAME);
  const dataRows = allRows.filter((row) => {
    const hasData = row.cells.some((c) => cellToString(c).length > 0);
    if (!hasData) return false;
    if (isHeaderRow(row.cells, ["müşteri ünvanı", "müşteri kodu", "vkn"])) return false;
    return true;
  });

  const userId = await resolveImportUserId();

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: RowError[] = [];

  console.log(`Toplam satır: ${dataRows.length}\n`);

  for (const { cells, rowNumber } of dataRows) {
    const mapped = mapMusteriRow(cells, rowNumber);

    if (!mapped.ok) {
      failed += 1;
      errors.push({
        rowNumber,
        message: mapped.error,
        code: pick(cells, 0) || undefined,
        name: pick(cells, 3) || undefined,
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
          ? "Vergi numarası başka kayıtta mevcut"
          : e.message;
      }
      errors.push({
        rowNumber: mapped.data.rowNumber,
        code: mapped.data.logoCustomerCode ?? undefined,
        name: mapped.data.legalName,
        message,
      });
    }
  }

  const successful = created + updated;

  console.log(color.bold("\n--- Sonuç ---"));
  console.log(`Toplam:       ${dataRows.length}`);
  console.log(color.green(`Başarılı:     ${successful} (${created} yeni, ${updated} güncelleme)`));
  console.log(failed > 0 ? color.red(`Hatalı:       ${failed}`) : color.green(`Hatalı:       ${failed}`));

  if (errors.length > 0) {
    console.log(color.red("\n--- Hatalar (ilk 20) ---"));
    for (const err of errors.slice(0, 20)) {
      const ref = [err.code, err.name].filter(Boolean).join(" | ");
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

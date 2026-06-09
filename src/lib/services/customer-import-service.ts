import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { createAuditLog } from "@/lib/audit/audit-service";
import {
  LOGO_IMPORT_SOURCE,
  LOGO_METADATA_KEY,
} from "@/lib/imports/logo-customer-fields";
import {
  mapRowWithMapping,
  type ColumnMappingInput,
  type ImportRowInput,
} from "@/lib/validations/customer-import";

export type ImportRowError = {
  rowNumber: number;
  customerCode?: string;
  message: string;
};

export type CustomerImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportRowError[];
  totalProcessed: number;
};

function splitAddress(raw: string | undefined): { line1: string; city: string } {
  const text = raw?.trim() ?? "";
  if (!text) {
    return { line1: "Adres belirtilmedi", city: "Belirtilmedi" };
  }

  const parts = text
    .split(/[/,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      line1: parts.slice(0, -1).join(", "),
      city: parts[parts.length - 1].slice(0, 100),
    };
  }

  return { line1: text.slice(0, 255), city: "Belirtilmedi" };
}

function buildMetadata(
  customerCode: string,
  existing?: Prisma.JsonValue | null
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return {
    ...base,
    [LOGO_METADATA_KEY]: customerCode,
    importSource: LOGO_IMPORT_SOURCE,
    lastImportedAt: new Date().toISOString(),
  };
}

async function findCustomerByLogoCode(
  tx: Prisma.TransactionClient,
  customerCode: string
) {
  return tx.customer.findFirst({
    where: {
      deletedAt: null,
      metadata: {
        path: [LOGO_METADATA_KEY],
        equals: customerCode,
      },
    },
    select: { id: true, metadata: true, taxNumber: true },
  });
}

async function findExistingCustomer(
  tx: Prisma.TransactionClient,
  row: ImportRowInput
) {
  const byCode = await findCustomerByLogoCode(tx, row.customerCode);
  if (byCode) return byCode;

  const byTax = await tx.customer.findFirst({
    where: { deletedAt: null, taxNumber: row.taxNumber },
    select: { id: true, metadata: true, taxNumber: true },
  });
  if (byTax) return byTax;

  return tx.customer.findFirst({
    where: {
      deletedAt: null,
      legalName: { equals: row.companyName, mode: "insensitive" },
    },
    select: { id: true, metadata: true, taxNumber: true },
  });
}

async function upsertPrimaryContact(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: ImportRowInput,
  userId: string
) {
  const fullName = row.contactPerson?.trim() || row.companyName;
  const phone = row.phone?.trim() || null;
  const email = row.email?.trim() || null;

  const primary = await tx.customerContact.findFirst({
    where: { customerId, deletedAt: null, isPrimary: true },
    select: { id: true },
  });

  if (primary) {
    await tx.customerContact.update({
      where: { id: primary.id },
      data: {
        fullName,
        phone,
        email,
        updatedById: userId,
      },
    });
    return;
  }

  if (fullName || phone || email) {
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
}

async function upsertPrimaryAddress(
  tx: Prisma.TransactionClient,
  customerId: string,
  row: ImportRowInput,
  userId: string
) {
  const { line1, city } = splitAddress(row.address);

  const primary = await tx.customerAddress.findFirst({
    where: { customerId, deletedAt: null, isPrimary: true },
    select: { id: true },
  });

  if (primary) {
    await tx.customerAddress.update({
      where: { id: primary.id },
      data: { line1, city, updatedById: userId },
    });
    return;
  }

  await tx.customerAddress.create({
    data: {
      customerId,
      line1,
      city,
      isPrimary: true,
      createdById: userId,
    },
  });
}

async function importRow(
  tx: Prisma.TransactionClient,
  user: SessionUser,
  row: ImportRowInput
): Promise<"created" | "updated"> {
  const existing = await findExistingCustomer(tx, row);

  if (existing) {
    await tx.customer.update({
      where: { id: existing.id },
      data: {
        legalName: row.companyName,
        taxNumber: row.taxNumber,
        status: "ACTIVE",
        metadata: buildMetadata(row.customerCode, existing.metadata),
        updatedById: user.id,
      },
    });

    await upsertPrimaryAddress(tx, existing.id, row, user.id);
    await upsertPrimaryContact(tx, existing.id, row, user.id);

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "customer",
      entityId: existing.id,
      changes: {
        source: LOGO_IMPORT_SOURCE,
        logoCustomerCode: row.customerCode,
        legalName: row.companyName,
      },
    });

    return "updated";
  }

  const created = await tx.customer.create({
    data: {
      legalName: row.companyName,
      taxNumber: row.taxNumber,
      status: "ACTIVE",
      assignedToId: user.id,
      metadata: buildMetadata(row.customerCode),
      createdById: user.id,
      updatedById: user.id,
    },
    select: { id: true },
  });

  await upsertPrimaryAddress(tx, created.id, row, user.id);
  await upsertPrimaryContact(tx, created.id, row, user.id);

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "customer",
    entityId: created.id,
    changes: {
      source: LOGO_IMPORT_SOURCE,
      logoCustomerCode: row.customerCode,
      legalName: row.companyName,
      taxNumber: row.taxNumber,
    },
  });

  return "created";
}

export async function importCustomersFromLogo(
  user: SessionUser,
  mapping: ColumnMappingInput,
  rawRows: Record<string, string>[]
): Promise<CustomerImportResult> {
  const result: CustomerImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    totalProcessed: rawRows.length,
  };

  const validRows: ImportRowInput[] = [];
  const seenCodes = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const mapped = mapRowWithMapping(row, rowNumber, mapping);

    if (!mapped.success) {
      result.skipped += 1;
      result.errors.push({
        rowNumber,
        message: mapped.error,
      });
      return;
    }

    const codeKey = mapped.data.customerCode.toLowerCase();
    if (seenCodes.has(codeKey)) {
      result.skipped += 1;
      result.errors.push({
        rowNumber,
        customerCode: mapped.data.customerCode,
        message: "Dosyada tekrarlayan cari kodu",
      });
      return;
    }
    seenCodes.add(codeKey);
    validRows.push(mapped.data);
  });

  if (validRows.length === 0) {
    return result;
  }

  for (const row of validRows) {
    try {
      const action = await prisma.$transaction((tx) => importRow(tx, user, row));
      if (action === "created") result.created += 1;
      else result.updated += 1;
    } catch (e) {
      result.skipped += 1;
      let message = "Kayıt işlenemedi";
      if (e instanceof Error) {
        if (e.message.includes("Unique constraint")) {
          message =
            "Vergi numarası başka bir müşteride kayıtlı (eşleşme yapılamadı)";
        } else {
          message = e.message;
        }
      }
      result.errors.push({
        rowNumber: row.rowNumber,
        customerCode: row.customerCode,
        message,
      });
    }
  }

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "customer_import",
    entityId: user.id,
    changes: {
      source: LOGO_IMPORT_SOURCE,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      totalProcessed: result.totalProcessed,
    },
  });

  return result;
}

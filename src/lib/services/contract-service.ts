import type { ActivityType, ContractStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type {
  ContractFormInput,
  ContractListQuery,
} from "@/lib/validations/contract";
import { ALLOWED_CONTRACT_MIME } from "@/lib/validations/contract";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { nextDocumentNumber } from "./number-sequence-service";
import {
  assertTransition,
  isContractEditable,
} from "./contract-state-machine";
import {
  calculateTotals,
  toDecimalString,
  type LineInput,
} from "@/lib/quotes/calculations";
import { decimalToNumber } from "@/lib/utils/serialize-decimal";
import { getCustomerForAccess } from "./customer-service";
import {
  buildContractTemplatePlaceholders,
  placeholdersToJson,
} from "@/lib/contracts/contract-placeholder-service";
import {
  buildEntityFilesPath,
  uploadEntityDocument,
} from "./document-upload-service";

export function buildContractAccessFilter(
  user: SessionUser
): Prisma.ContractWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  if (hasRole(user, "SALES")) {
    return {
      ...cf,
      OR: [
        { createdById: user.id },
        { ownerId: user.id },
        {
          customer: {
            OR: [
              { assignedToId: user.id },
              { createdById: user.id },
            ],
          },
        },
      ],
    };
  }
  return { id: "00000000-0000-0000-0000-000000000000" };
}

export type ContractCursor = { createdAt: string; id: string };

export function encodeContractCursor(c: ContractCursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeContractCursor(raw?: string): ContractCursor | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as ContractCursor;
    if (p.createdAt && p.id) return p;
  } catch {
    return null;
  }
  return null;
}

const LIST_SELECT = {
  id: true,
  number: true,
  title: true,
  status: true,
  currency: true,
  total: true,
  startDate: true,
  endDate: true,
  autoRenew: true,
  createdAt: true,
  customer: {
    select: { id: true, legalName: true },
  },
} as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function buildListWhere(
  user: SessionUser,
  query: ContractListQuery
): Prisma.ContractWhereInput {
  const where: Prisma.ContractWhereInput = {
    deletedAt: null,
    ...buildContractAccessFilter(user),
  };
  if (query.status) where.status = query.status;
  if (query.customerId) where.customerId = query.customerId;
  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    where.OR = [
      { number: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      {
        customer: {
          legalName: { contains: term, mode: "insensitive" },
        },
      },
    ];
  }
  if (query.expiringWithinDays) {
    const today = startOfDay(new Date());
    const until = new Date(today);
    until.setDate(until.getDate() + query.expiringWithinDays);
    where.status = "ACTIVE";
    where.endDate = { gte: today, lte: endOfDay(until) };
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) {
      where.createdAt.gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  return where;
}

export async function listContracts(
  user: SessionUser,
  query: ContractListQuery
) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeContractCursor(query.cursor);

  const listWhere: Prisma.ContractWhereInput = { ...where };
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);
    listWhere.AND = [
      ...(Array.isArray(listWhere.AND)
        ? listWhere.AND
        : listWhere.AND
          ? [listWhere.AND]
          : []),
      {
        OR: [
          { createdAt: { lt: cursorDate } },
          { createdAt: cursorDate, id: { lt: cursor.id } },
        ],
      },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where: listWhere,
      select: LIST_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map((row) => ({
    ...row,
    total: decimalToNumber(row.total),
  }));
  const last = items[items.length - 1];

  return {
    items,
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeContractCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getContractAccess(
  user: SessionUser,
  contractId: string
) {
  return prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true },
  });
}

export async function getContractDetail(
  user: SessionUser,
  contractId: string
) {
  return prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      currency: true,
      startDate: true,
      endDate: true,
      signedAt: true,
      autoRenew: true,
      renewalNoticeDays: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      notes: true,
      terms: true,
      invoiceNumber: true,
      quoteId: true,
      parentContractId: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          taxNumber: true,
        },
      },
      sourceQuote: {
        select: { id: true, number: true, status: true },
      },
      parentContract: {
        select: { id: true, number: true },
      },
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
      lineItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          productId: true,
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
          sortOrder: true,
        },
      },
      contractDevices: {
        orderBy: { createdAt: "asc" },
        select: {
          deviceId: true,
          device: {
            select: {
              id: true,
              deviceName: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
          },
        },
      },
      templateData: true,
    },
  });
}

export async function listContractDeviceIds(
  user: SessionUser,
  contractId: string
): Promise<string[]> {
  const access = await getContractAccess(user, contractId);
  if (!access) return [];

  const rows = await prisma.contractDevice.findMany({
    where: { contractId },
    select: { deviceId: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.deviceId);
}

export async function getContractForPdf(contractId: string) {
  return prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: {
      number: true,
      status: true,
      title: true,
      currency: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      notes: true,
      terms: true,
      autoRenew: true,
      renewalNoticeDays: true,
      customer: {
        select: {
          legalName: true,
          tradeName: true,
          taxNumber: true,
          taxOffice: true,
          addresses: {
            where: { deletedAt: null, isPrimary: true },
            take: 1,
            select: { line1: true, city: true },
          },
          contacts: {
            where: { deletedAt: null, isPrimary: true },
            take: 1,
            select: { fullName: true },
          },
        },
      },
      lineItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
        },
      },
    },
  });
}

async function logContractActivity(
  customerId: string,
  contractId: string,
  userId: string,
  type: ActivityType,
  title: string,
  description?: string,
  metadata?: Prisma.InputJsonValue
) {
  await createActivity({
    customerId,
    type,
    title,
    description,
    userId,
    createdById: userId,
    contractId,
    metadata,
  });
}

function mapLineItems(items: ContractFormInput["lineItems"]): LineInput[] {
  return items.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
  }));
}

async function upsertContractLineItems(
  tx: Prisma.TransactionClient,
  contractId: string,
  items: ContractFormInput["lineItems"]
) {
  await tx.contractLineItem.deleteMany({ where: { contractId } });
  const { lines } = calculateTotals(mapLineItems(items));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const calc = lines[i];
    await tx.contractLineItem.create({
      data: {
        contractId,
        productId: item.productId || null,
        sortOrder: i,
        description: item.description.trim(),
        quantity: toDecimalString(item.quantity),
        unit: item.unit,
        unitPrice: toDecimalString(item.unitPrice),
        taxRate: toDecimalString(item.taxRate),
        lineTotal: toDecimalString(calc.lineTotal),
      },
    });
  }
}

async function validateQuoteLink(
  customerId: string,
  quoteId?: string
) {
  if (!quoteId) return;
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      customerId,
      deletedAt: null,
      status: { in: ["APPROVED", "CONVERTED"] },
    },
    select: { id: true },
  });
  if (!quote) {
    throw new Error("Seçilen teklif bu müşteriye ait değil veya kullanılamaz");
  }
}

async function validateContractDevices(
  customerId: string,
  deviceIds: string[]
) {
  // Cihaz seçimi zorunlu değil — boş liste geçerlidir
  if (deviceIds.length === 0) return;

  const uniqueIds = [...new Set(deviceIds)];
  const devices = await prisma.customerDevice.findMany({
    where: {
      id: { in: uniqueIds },
      customerId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (devices.length !== uniqueIds.length) {
    throw new Error("Seçilen cihazlar bu müşteriye ait değil");
  }
}

async function upsertContractDevices(
  tx: Prisma.TransactionClient,
  contractId: string,
  deviceIds: string[]
) {
  await tx.contractDevice.deleteMany({ where: { contractId } });
  const uniqueIds = [...new Set(deviceIds)];
  for (const deviceId of uniqueIds) {
    await tx.contractDevice.create({
      data: { contractId, deviceId },
    });
  }
}

async function buildTemplateDataForContract(
  tx: Prisma.TransactionClient,
  contractId: string
) {
  const contract = await tx.contract.findFirst({
    where: { id: contractId },
    select: {
      number: true,
      contractDate: true,
      signedAt: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      subtotal: true,
      total: true,
      currency: true,
      customer: {
        select: {
          legalName: true,
          taxNumber: true,
          taxOffice: true,
          addresses: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: {
              line1: true,
              line2: true,
              district: true,
              city: true,
              isPrimary: true,
            },
          },
          contacts: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: {
              phone: true,
              mobile: true,
              email: true,
              isPrimary: true,
            },
          },
        },
      },
      invoiceNumber: true,
      contractDevices: {
        orderBy: { createdAt: "asc" },
        select: {
          device: {
            select: {
              deviceName: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
          },
        },
      },
    },
  });
  if (!contract) return null;

  const placeholders = buildContractTemplatePlaceholders({
    ...contract,
    devices: contract.contractDevices.map((cd) => cd.device),
    invoiceNumber: contract.invoiceNumber ?? "",
  });

  await tx.contract.update({
    where: { id: contractId },
    data: { templateData: placeholdersToJson(placeholders) },
  });

  return placeholders;
}

export async function createContract(
  user: SessionUser,
  input: ContractFormInput
) {
  const customer = await getCustomerForAccess(user, input.customerId);
  if (!customer) throw new Error("Müşteri bulunamadı veya erişim yok");

  const quoteId = input.quoteId?.trim() || undefined;
  await validateQuoteLink(input.customerId, quoteId);
  await validateContractDevices(input.customerId, input.deviceIds);

  const { subtotal, taxTotal, total } = calculateTotals(
    mapLineItems(input.lineItems)
  );
  const number = await nextDocumentNumber("CONTRACT", user.companyId);
  const ownerId = input.ownerId?.trim() || user.id;

  const contract = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({
      data: {
        companyId: user.companyId ?? undefined,
        number,
        customerId: input.customerId,
        quoteId: quoteId ?? null,
        title: input.title.trim(),
        status: "DRAFT",
        currency: input.currency,
        contractDate: new Date(input.contractDate),
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        autoRenew: input.autoRenew ?? false,
        renewalNoticeDays: input.renewalNoticeDays,
        notes: input.notes?.trim() || null,
        terms: input.terms?.trim() || null,
        invoiceNumber: input.invoiceNumber?.trim() ?? "",
        subtotal: toDecimalString(subtotal),
        taxTotal: toDecimalString(taxTotal),
        total: toDecimalString(total),
        ownerId,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, number: true, customerId: true },
    });

    await upsertContractLineItems(tx, created.id, input.lineItems);
    await upsertContractDevices(tx, created.id, input.deviceIds);
    await buildTemplateDataForContract(tx, created.id);
    return created;
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "contract",
    entityId: contract.id,
    changes: { number, title: input.title },
  });

  logContractActivity(
    contract.customerId,
    contract.id,
    user.id,
    "CONTRACT_CREATED",
    "Sözleşme oluşturuldu",
    `${contract.number} — ${input.title}`
  ).catch(() => undefined);

  void import("./contract-pdf-service")
    .then(({ generateContractPdf }) =>
      generateContractPdf(contract.id, user.id)
    )
    .catch((e) => console.error("[contract] PDF üretimi başarısız:", e));

  return contract.id;
}

export async function updateContract(
  user: SessionUser,
  contractId: string,
  input: ContractFormInput
) {
  const existing = await prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true },
  });
  if (!existing) return null;
  if (!isContractEditable(existing.status)) {
    throw new Error("Bu durumdaki sözleşme düzenlenemez");
  }

  const quoteId = input.quoteId?.trim() || undefined;
  await validateQuoteLink(input.customerId, quoteId);
  await validateContractDevices(input.customerId, input.deviceIds);

  const { subtotal, taxTotal, total } = calculateTotals(
    mapLineItems(input.lineItems)
  );

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contractId },
      data: {
        title: input.title.trim(),
        customerId: input.customerId,
        quoteId: quoteId ?? null,
        currency: input.currency,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        autoRenew: input.autoRenew ?? false,
        renewalNoticeDays: input.renewalNoticeDays,
        notes: input.notes?.trim() || null,
        terms: input.terms?.trim() || null,
        invoiceNumber: input.invoiceNumber?.trim() ?? "",
        subtotal: toDecimalString(subtotal),
        taxTotal: toDecimalString(taxTotal),
        total: toDecimalString(total),
        updatedById: user.id,
      },
    });
    await upsertContractLineItems(tx, contractId, input.lineItems);
    await upsertContractDevices(tx, contractId, input.deviceIds);
    await buildTemplateDataForContract(tx, contractId);
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "contract",
    entityId: contractId,
    changes: { title: input.title },
  });

  logContractActivity(
    existing.customerId,
    contractId,
    user.id,
    "CONTRACT_UPDATED",
    "Sözleşme güncellendi",
    input.title
  ).catch(() => undefined);

  void import("./contract-pdf-service")
    .then(({ generateContractPdf }) =>
      generateContractPdf(contractId, user.id)
    )
    .catch((e) => console.error("[contract] PDF yenileme başarısız:", e));

  return contractId;
}

const STATUS_ACTIVITY: Partial<
  Record<ContractStatus, { type: ActivityType; title: string }>
> = {
  SIGNED: {
    type: "CONTRACT_ACTIVATED",
    title: "Sözleşme imzalandı ve kilitlendi",
  },
  ACTIVE: { type: "CONTRACT_ACTIVATED", title: "Sözleşme aktifleştirildi" },
  SUSPENDED: {
    type: "CONTRACT_SUSPENDED",
    title: "Sözleşme askıya alındı",
  },
  EXPIRED: { type: "CONTRACT_EXPIRED", title: "Sözleşme süresi doldu" },
  TERMINATED: {
    type: "CONTRACT_TERMINATED",
    title: "Sözleşme feshedildi",
  },
  RENEWED: { type: "CONTRACT_RENEWED", title: "Sözleşme yenilendi" },
};

async function transitionContract(
  user: SessionUser,
  contractId: string,
  to: ContractStatus,
  extra: Prisma.ContractUncheckedUpdateInput = {},
  reason?: string
) {
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    select: {
      id: true,
      status: true,
      customerId: true,
      number: true,
    },
  });
  if (!contract) return null;

  assertTransition(contract.status, to);

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: to,
      updatedById: user.id,
      ...extra,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "contract",
    entityId: contractId,
    changes: { from: contract.status, to, reason: reason ?? null },
  });

  const activity = STATUS_ACTIVITY[to];
  if (activity) {
    await logContractActivity(
      contract.customerId,
      contractId,
      user.id,
      activity.type,
      activity.title,
      reason
    );
  }

  return contract;
}

export async function signContract(
  user: SessionUser,
  contractId: string
) {
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true, number: true },
  });
  if (!contract) return null;
  if (contract.status !== "DRAFT") {
    throw new Error("Yalnızca taslak sözleşmeler imzalanabilir");
  }

  const { generateContractPdf } = await import("./contract-pdf-service");
  const docs = await generateContractPdf(contractId, user.id, {
    includeStamp: true,
  });
  if (!docs) {
    throw new Error("İmzalı PDF oluşturulamadı");
  }

  await transitionContract(user, contractId, "SIGNED", {
    signedAt: new Date(),
  });

  await createAuditLog({
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "contract",
    entityId: contractId,
    changes: {
      action: "SIGN",
      pdfVersion: docs.version,
      signedAt: new Date().toISOString(),
    },
  });

  return { contract, pdfVersionId: docs.pdfVersionId, version: docs.version };
}

export async function activateContract(
  user: SessionUser,
  contractId: string
) {
  return transitionContract(user, contractId, "ACTIVE");
}

export async function suspendContract(
  user: SessionUser,
  contractId: string,
  reason?: string
) {
  return transitionContract(user, contractId, "SUSPENDED", {}, reason);
}

export async function resumeContract(
  user: SessionUser,
  contractId: string
) {
  return transitionContract(user, contractId, "ACTIVE");
}

export async function terminateContract(
  user: SessionUser,
  contractId: string,
  reason?: string
) {
  return transitionContract(user, contractId, "TERMINATED", {}, reason);
}

export async function expireContract(
  user: SessionUser,
  contractId: string
) {
  return transitionContract(user, contractId, "EXPIRED");
}

export async function listContractActivities(
  user: SessionUser,
  contractId: string
) {
  const c = await getContractAccess(user, contractId);
  if (!c) return [];

  return prisma.activity.findMany({
    where: { contractId, deletedAt: null },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      occurredAt: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
}

export async function listContractRenewals(
  user: SessionUser,
  contractId: string
) {
  const c = await getContractAccess(user, contractId);
  if (!c) return [];

  return prisma.contractRenewal.findMany({
    where: { contractId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      previousEndDate: true,
      newStartDate: true,
      newEndDate: true,
      newTotal: true,
      renewedAt: true,
      createdAt: true,
      newContractId: true,
    },
  });
}

export async function listContractPdfVersions(
  user: SessionUser,
  contractId: string
) {
  const c = await getContractAccess(user, contractId);
  if (!c) return [];

  return prisma.contractPdfVersion.findMany({
    where: { contractId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      sizeBytes: true,
      createdAt: true,
    },
  });
}

export async function listContractDocuments(
  user: SessionUser,
  contractId: string
) {
  const c = await getContractAccess(user, contractId);
  if (!c) return [];

  return prisma.documentLink.findMany({
    where: {
      entityType: "CONTRACT",
      entityId: contractId,
      document: { deletedAt: null },
    },
    select: {
      id: true,
      label: true,
      document: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listContractAuditLogs(
  user: SessionUser,
  contractId: string
) {
  const c = await getContractAccess(user, contractId);
  if (!c) return [];

  return prisma.auditLog.findMany({
    where: { entityType: "contract", entityId: contractId },
    select: {
      id: true,
      action: true,
      changes: true,
      createdAt: true,
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listCustomersForContractSelect(user: SessionUser) {
  const cf = !isSuperAdmin(user) && user.companyId ? { companyId: user.companyId } : {};
  const filter: Prisma.CustomerWhereInput =
    isSuperAdmin(user)
      ? { deletedAt: null }
      : hasRole(user, "ADMIN")
        ? { deletedAt: null, ...cf }
        : {
            deletedAt: null,
            ...cf,
            OR: [
              { assignedToId: user.id },
              { createdById: user.id },
            ],
          };

  return prisma.customer.findMany({
    where: filter,
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function listQuotesForContractSelect(
  user: SessionUser,
  customerId?: string
) {
  const where: Prisma.QuoteWhereInput = {
    deletedAt: null,
    status: { in: ["APPROVED", "CONVERTED"] },
    ...(customerId ? { customerId } : {}),
  };

  if (!isSuperAdmin(user) && !hasRole(user, "ADMIN")) {
    if (hasRole(user, "SALES")) {
      where.OR = [
        { createdById: user.id },
        {
          customer: {
            OR: [
              { assignedToId: user.id },
              { createdById: user.id },
            ],
          },
        },
      ];
    }
  }

  return prisma.quote.findMany({
    where,
    select: { id: true, number: true, title: true, customerId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export { listActiveProducts } from "@/lib/services/product-service";

export async function uploadContractDocument(
  user: SessionUser,
  contractId: string,
  file: { name: string; type: string; buffer: Buffer }
) {
  const access = await getContractAccess(user, contractId);
  if (!access) return null;

  const contract = await prisma.contract.findFirst({
    where: { id: contractId },
    select: { customerId: true },
  });
  if (!contract) return null;

  const documentId = await uploadEntityDocument({
    entityType: "CONTRACT",
    entityId: contractId,
    customerId: contract.customerId,
    uploadedById: user.id,
    file,
    storageSubPath: buildEntityFilesPath("CONTRACT", contractId),
    allowedMime: ALLOWED_CONTRACT_MIME,
    activityTitle: "Sözleşmeye dosya yüklendi",
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "contract",
    entityId: contractId,
    changes: { documentId, fileName: file.name },
  });

  return documentId;
}

export async function deleteContract(user: SessionUser, contractId: string) {
  const existing = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null, ...buildContractAccessFilter(user) },
    select: { id: true, number: true, status: true },
  });
  if (!existing) return null;

  await prisma.contract.update({
    where: { id: contractId },
    data: { deletedAt: new Date(), updatedById: user.id },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "contract",
    entityId: contractId,
    changes: { number: existing.number, status: existing.status },
  });

  return existing.number;
}

export async function getContractDocumentForDownload(
  user: SessionUser,
  documentId: string
) {
  const link = await prisma.documentLink.findFirst({
    where: {
      documentId,
      entityType: "CONTRACT",
      document: { deletedAt: null },
    },
    select: {
      entityId: true,
      document: {
        select: {
          originalName: true,
          mimeType: true,
          relativePath: true,
        },
      },
    },
  });
  if (!link) return null;

  const access = await getContractAccess(user, link.entityId);
  if (!access) return null;

  return link.document;
}

import type { ActivityType, Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type { QuoteFormInput, QuoteListQuery } from "@/lib/validations/quote";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { nextDocumentNumber } from "./number-sequence-service";
import {
  assertTransition,
  isQuoteEditable,
} from "./quote-state-machine";
import {
  calculateTotals,
  toDecimalString,
  type LineInput,
} from "@/lib/quotes/calculations";
import { decimalToNumber } from "@/lib/utils/serialize-decimal";
import { getCustomerForAccess } from "./customer-service";

export function buildQuoteAccessFilter(
  user: SessionUser
): Prisma.QuoteWhereInput {
  if (isSuperAdmin(user) || hasRole(user, "ADMIN")) {
    return {};
  }
  if (hasRole(user, "SALES")) {
    return {
      OR: [
        { createdById: user.id },
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

export type QuoteCursor = { createdAt: string; id: string };

export function encodeQuoteCursor(c: QuoteCursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeQuoteCursor(raw?: string): QuoteCursor | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as QuoteCursor;
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
  validUntil: true,
  version: true,
  createdAt: true,
  customer: {
    select: { id: true, legalName: true },
  },
} as const;

function buildListWhere(
  user: SessionUser,
  query: QuoteListQuery
): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {
    deletedAt: null,
    ...buildQuoteAccessFilter(user),
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

export async function listQuotes(user: SessionUser, query: QuoteListQuery) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeQuoteCursor(query.cursor);

  const listWhere: Prisma.QuoteWhereInput = { ...where };
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
    prisma.quote.count({ where }),
    prisma.quote.findMany({
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
        ? encodeQuoteCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getQuoteAccess(
  user: SessionUser,
  quoteId: string
) {
  return prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    select: { id: true, status: true },
  });
}

export async function getQuoteDetail(user: SessionUser, quoteId: string) {
  return prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      currency: true,
      version: true,
      validUntil: true,
      sentAt: true,
      approvedAt: true,
      rejectedAt: true,
      convertedAt: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      notes: true,
      terms: true,
      createdAt: true,
      updatedAt: true,
      convertedContractId: true,
      customer: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          taxNumber: true,
        },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
      lineItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          productId: true,
          productCode: true,
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
          sortOrder: true,
          product: { select: { sku: true } },
        },
      },
      convertedContract: {
        select: { id: true, number: true },
      },
    },
  });
}

export async function getQuoteForPdf(quoteId: string) {
  return prisma.quote.findFirst({
    where: { id: quoteId, deletedAt: null },
    select: {
      number: true,
      status: true,
      title: true,
      version: true,
      currency: true,
      validUntil: true,
      createdAt: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      notes: true,
      terms: true,
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
          productCode: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
          product: { select: { sku: true } },
        },
      },
    },
  });
}

async function logQuoteActivity(
  customerId: string,
  quoteId: string,
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
    quoteId,
    metadata,
  });
}

function mapLineItems(items: QuoteFormInput["lineItems"]): LineInput[] {
  return items.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
  }));
}

async function upsertLineItems(
  tx: Prisma.TransactionClient,
  quoteId: string,
  items: QuoteFormInput["lineItems"]
) {
  await tx.quoteLineItem.deleteMany({ where: { quoteId } });
  const { lines } = calculateTotals(mapLineItems(items));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const calc = lines[i];
    await tx.quoteLineItem.create({
      data: {
        quoteId,
        productId: item.productId || null,
        productCode: item.productCode?.trim() || null,
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

export async function createQuote(
  user: SessionUser,
  input: QuoteFormInput
) {
  const customer = await getCustomerForAccess(user, input.customerId);
  if (!customer) throw new Error("Müşteri bulunamadı veya erişim yok");

  const { subtotal, taxTotal, total } = calculateTotals(
    mapLineItems(input.lineItems)
  );
  const number = await nextDocumentNumber("QUOTE");

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        number,
        customerId: input.customerId,
        title: input.title.trim(),
        currency: input.currency,
        validUntil: input.validUntil
          ? new Date(input.validUntil)
          : null,
        notes: input.notes?.trim() || null,
        terms: input.terms?.trim() || null,
        subtotal: toDecimalString(subtotal),
        taxTotal: toDecimalString(taxTotal),
        total: toDecimalString(total),
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, number: true, customerId: true },
    });

    await upsertLineItems(tx, created.id, input.lineItems);
    return created;
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "quote",
    entityId: quote.id,
    changes: { number, title: input.title },
  });

  await logQuoteActivity(
    quote.customerId,
    quote.id,
    user.id,
    "QUOTE_CREATED",
    "Teklif oluşturuldu",
    `${quote.number} — ${input.title}`
  );

  return quote.id;
}

export async function updateQuote(
  user: SessionUser,
  quoteId: string,
  input: QuoteFormInput
) {
  const existing = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true, version: true },
  });
  if (!existing) return null;
  if (!isQuoteEditable(existing.status)) {
    throw new Error("Bu durumdaki teklif düzenlenemez");
  }

  const { subtotal, taxTotal, total } = calculateTotals(
    mapLineItems(input.lineItems)
  );

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        title: input.title.trim(),
        customerId: input.customerId,
        currency: input.currency,
        validUntil: input.validUntil
          ? new Date(input.validUntil)
          : null,
        notes: input.notes?.trim() || null,
        terms: input.terms?.trim() || null,
        subtotal: toDecimalString(subtotal),
        taxTotal: toDecimalString(taxTotal),
        total: toDecimalString(total),
        updatedById: user.id,
      },
    });
    await upsertLineItems(tx, quoteId, input.lineItems);
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "quote",
    entityId: quoteId,
    changes: { title: input.title },
  });

  await logQuoteActivity(
    existing.customerId,
    quoteId,
    user.id,
    "QUOTE_UPDATED",
    "Teklif güncellendi",
    input.title
  );

  return quoteId;
}

async function transitionQuote(
  user: SessionUser,
  quoteId: string,
  to: QuoteStatus,
  extra: Prisma.QuoteUncheckedUpdateInput,
  activity: { type: ActivityType; title: string; description?: string },
  auditAction: "UPDATE" | "CONVERT" = "UPDATE"
) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    select: {
      id: true,
      status: true,
      customerId: true,
      number: true,
      version: true,
      title: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      notes: true,
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
  if (!quote) return null;

  assertTransition(quote.status, to);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: to,
      updatedById: user.id,
      ...extra,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: auditAction,
    entityType: "quote",
    entityId: quoteId,
    changes: { from: quote.status, to },
  });

  await logQuoteActivity(
    quote.customerId,
    quoteId,
    user.id,
    activity.type,
    activity.title,
    activity.description
  );

  return quote;
}

export async function sendQuote(user: SessionUser, quoteId: string) {
  return transitionQuote(
    user,
    quoteId,
    "SENT",
    { sentAt: new Date() },
    { type: "QUOTE_SENT", title: "Teklif gönderildi" }
  );
}

export async function approveQuote(user: SessionUser, quoteId: string) {
  return transitionQuote(
    user,
    quoteId,
    "APPROVED",
    { approvedAt: new Date() },
    { type: "QUOTE_APPROVED", title: "Teklif onaylandı" }
  );
}

export async function rejectQuote(
  user: SessionUser,
  quoteId: string,
  reason?: string
) {
  return transitionQuote(
    user,
    quoteId,
    "REJECTED",
    { rejectedAt: new Date() },
    {
      type: "QUOTE_REJECTED",
      title: "Teklif reddedildi",
      description: reason,
    }
  );
}

export async function startQuoteRevision(
  user: SessionUser,
  quoteId: string
) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quote) return null;

  assertTransition(quote.status, "REVISION");

  await prisma.$transaction(async (tx) => {
    await tx.quoteRevision.create({
      data: {
        quoteId,
        version: quote.version,
        title: quote.title,
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
        notes: quote.notes,
        lineItems: quote.lineItems.map((l) => ({
          description: l.description,
          quantity: l.quantity.toString(),
          unit: l.unit,
          unitPrice: l.unitPrice.toString(),
          taxRate: l.taxRate.toString(),
          lineTotal: l.lineTotal.toString(),
          productId: l.productId,
        })),
        createdById: user.id,
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "REVISION",
        version: quote.version + 1,
        updatedById: user.id,
      },
    });
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "quote",
    entityId: quoteId,
    changes: { status: "REVISION", version: quote.version + 1 },
  });

  await logQuoteActivity(
    quote.customerId,
    quoteId,
    user.id,
    "QUOTE_REVISED",
    "Teklif revizyona alındı",
    `Revizyon v${quote.version + 1}`
  );

  return quote;
}

export async function resendQuote(user: SessionUser, quoteId: string) {
  return transitionQuote(
    user,
    quoteId,
    "SENT",
    { sentAt: new Date() },
    {
      type: "QUOTE_SENT",
      title: "Revize teklif gönderildi",
    }
  );
}

export async function convertQuoteToContract(
  user: SessionUser,
  quoteId: string,
  options: { startDate: string; endDate?: string; ownerId?: string }
) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
      ...buildQuoteAccessFilter(user),
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quote) return null;

  assertTransition(quote.status, "CONVERTED");

  const contractNumber = await nextDocumentNumber("CONTRACT");
  const ownerId = options.ownerId ?? user.id;
  const startDate = new Date(options.startDate);
  const endDate = options.endDate ? new Date(options.endDate) : null;

  const result = await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        number: contractNumber,
        customerId: quote.customerId,
        quoteId: quote.id,
        title: quote.title,
        status: "DRAFT",
        currency: quote.currency,
        startDate,
        endDate,
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        ownerId,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, number: true },
    });

    for (let i = 0; i < quote.lineItems.length; i++) {
      const line = quote.lineItems[i];
      await tx.contractLineItem.create({
        data: {
          contractId: contract.id,
          productId: line.productId,
          sortOrder: i,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          lineTotal: line.lineTotal,
        },
      });
    }

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "CONVERTED",
        convertedContractId: contract.id,
        convertedAt: new Date(),
        updatedById: user.id,
      },
    });

    return contract;
  });

  await createAuditLog({
    userId: user.id,
    action: "CONVERT",
    entityType: "quote",
    entityId: quoteId,
    changes: {
      contractId: result.id,
      contractNumber: result.number,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "contract",
    entityId: result.id,
    changes: { fromQuote: quoteId },
  });

  await logQuoteActivity(
    quote.customerId,
    quoteId,
    user.id,
    "QUOTE_CONVERTED",
    "Teklif sözleşmeye dönüştürüldü",
    result.number
  );

  await createActivity({
    customerId: quote.customerId,
    type: "CONTRACT_CREATED",
    title: "Sözleşme oluşturuldu (tekliften)",
    description: result.number,
    userId: user.id,
    createdById: user.id,
    quoteId,
    contractId: result.id,
  });

  return result;
}

export async function listQuoteActivities(
  user: SessionUser,
  quoteId: string
) {
  const q = await getQuoteAccess(user, quoteId);
  if (!q) return [];

  return prisma.activity.findMany({
    where: { quoteId, deletedAt: null },
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

export async function listQuoteRevisions(
  user: SessionUser,
  quoteId: string
) {
  const q = await getQuoteAccess(user, quoteId);
  if (!q) return [];

  return prisma.quoteRevision.findMany({
    where: { quoteId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      title: true,
      total: true,
      createdAt: true,
    },
  });
}

export async function listQuotePdfVersions(
  user: SessionUser,
  quoteId: string
) {
  const q = await getQuoteAccess(user, quoteId);
  if (!q) return [];

  return prisma.quotePdfVersion.findMany({
    where: { quoteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quoteVersion: true,
      sizeBytes: true,
      createdAt: true,
    },
  });
}

export async function listQuoteDocuments(
  user: SessionUser,
  quoteId: string
) {
  const q = await getQuoteAccess(user, quoteId);
  if (!q) return [];

  return prisma.documentLink.findMany({
    where: {
      entityType: "QUOTE",
      entityId: quoteId,
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

export { listActiveProducts } from "@/lib/services/product-service";

export async function listCustomersForQuoteSelect(user: SessionUser) {
  const filter =
    isSuperAdmin(user) || hasRole(user, "ADMIN")
      ? { deletedAt: null }
      : {
          deletedAt: null,
          OR: [
            { assignedToId: user.id },
            { createdById: user.id },
          ],
        };

  return prisma.customer.findMany({
    where: filter,
    select: { id: true, legalName: true, taxNumber: true },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function deleteQuote(user: SessionUser, quoteId: string) {
  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, deletedAt: null },
    select: { id: true, number: true, status: true },
  });
  if (!existing) return null;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { deletedAt: new Date(), updatedById: user.id },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "quote",
    entityId: quoteId,
    changes: { number: existing.number, status: existing.status },
  });

  return existing.number;
}

export function quoteToFormInput(
  quote: NonNullable<Awaited<ReturnType<typeof getQuoteDetail>>>
): QuoteFormInput {
  return {
    title: quote.title,
    customerId: quote.customer.id,
    currency: quote.currency,
    validUntil: quote.validUntil
      ? quote.validUntil.toISOString().slice(0, 10)
      : "",
    notes: quote.notes ?? "",
    terms: quote.terms ?? "",
    lineItems: quote.lineItems.map((l) => ({
      productId: l.productId ?? "",
      productCode: l.productCode ?? l.product?.sku ?? "",
      description: l.description,
      quantity: Number(l.quantity.toString()),
      unit: l.unit,
      unitPrice: Number(l.unitPrice.toString()),
      taxRate: Number(l.taxRate.toString()),
    })),
  };
}

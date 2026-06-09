import type { DocumentEntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasPermission, hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type { FileCenterListQuery } from "@/lib/validations/file-center";
import type {
  FileCenterCursor,
  FileCenterItem,
  FileCenterModule,
  FileCenterSource,
} from "./file-center-types";
import { mimeToFileType } from "@/lib/utils/file-format";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { getStorageAdapter } from "@/lib/storage";
import { buildContractAccessFilter } from "./contract-service";
import { buildQuoteAccessFilter } from "./quote-service";
import { buildServiceTicketAccessFilter } from "./service-ticket-service";
import { buildVisitAccessFilter } from "./visit-service";

const SOURCE_RANK: Record<FileCenterSource, number> = {
  quote_pdf: 0,
  contract_pdf: 1,
  document: 2,
};

function salesCustomerWhere(user: SessionUser): Prisma.CustomerWhereInput {
  return {
    OR: [{ assignedToId: user.id }, { createdById: user.id }],
  };
}

function canAccessAllFiles(user: SessionUser) {
  return isSuperAdmin(user) || hasRole(user, "ADMIN");
}

function canAccessCustomer(
  user: SessionUser,
  customerId: string
): Promise<boolean> {
  if (canAccessAllFiles(user)) return Promise.resolve(true);
  if (hasRole(user, "SALES")) {
    return prisma.customer
      .findFirst({
        where: {
          id: customerId,
          deletedAt: null,
          ...salesCustomerWhere(user),
        },
        select: { id: true },
      })
      .then(Boolean);
  }
  if (hasRole(user, "VIEWER")) {
    return prisma.customer
      .findFirst({
        where: { id: customerId, deletedAt: null },
        select: { id: true },
      })
      .then(Boolean);
  }
  if (
    hasRole(user, "TECHNICIAN") ||
    hasRole(user, "FIELD_OPS")
  ) {
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}

export function encodeFileCenterCursor(c: FileCenterCursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeFileCenterCursor(
  raw?: string
): FileCenterCursor | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as FileCenterCursor;
    if (p.createdAt && p.id && p.source) return p;
  } catch {
    return null;
  }
  return null;
}

function itemSortKey(item: FileCenterItem) {
  return `${item.createdAt.getTime()}-${SOURCE_RANK[item.source]}-${item.sourceId}`;
}

function compareItems(a: FileCenterItem, b: FileCenterItem) {
  if (b.createdAt.getTime() !== a.createdAt.getTime()) {
    return b.createdAt.getTime() - a.createdAt.getTime();
  }
  const rankDiff = SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
  if (rankDiff !== 0) return rankDiff;
  return a.sourceId.localeCompare(b.sourceId);
}

function applyCursorSlice(
  items: FileCenterItem[],
  cursor: FileCenterCursor | null,
  limit: number
) {
  const sorted = [...items].sort(compareItems);
  let start = 0;
  if (cursor) {
    const cursorKey = `${new Date(cursor.createdAt).getTime()}-${SOURCE_RANK[cursor.source]}-${cursor.id}`;
    start = sorted.findIndex((i) => itemSortKey(i) < cursorKey);
    if (start < 0) start = sorted.length;
  }
  const page = sorted.slice(start, start + limit + 1);
  const hasMore = page.length > limit;
  const result = hasMore ? page.slice(0, limit) : page;
  const last = result[result.length - 1];
  return {
    items: result,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeFileCenterCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.sourceId,
            source: last.source,
          })
        : null,
  };
}

function buildDateRange(query: FileCenterListQuery) {
  const range: { gte?: Date; lte?: Date } = {};
  if (query.dateFrom) range.gte = new Date(query.dateFrom);
  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length ? range : undefined;
}

function quotePdfToItem(
  row: {
    id: string;
    sizeBytes: number;
    mimeType: string;
    createdAt: Date;
    createdById: string | null;
    quote: {
      id: string;
      number: string;
      customerId: string;
      customer: { legalName: string };
    };
  },
  users: Map<string, { id: string; firstName: string; lastName: string }>
): FileCenterItem {
  const fileName = `${row.quote.number}.pdf`;
  return {
    id: `quote_pdf:${row.id}`,
    source: "quote_pdf",
    sourceId: row.id,
    fileName,
    module: "QUOTE",
    fileType: "PDF",
    customerId: row.quote.customerId,
    customerName: row.quote.customer.legalName,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    uploadedBy: row.createdById
      ? users.get(row.createdById) ?? null
      : null,
    entityId: row.quote.id,
    detailPath: `/quotes/${row.quote.id}`,
    viewUrl: `/api/files/quote-pdf/${row.id}?inline=1`,
    downloadUrl: `/api/files/quote-pdf/${row.id}`,
    canDelete: false,
  };
}

function contractPdfToItem(
  row: {
    id: string;
    sizeBytes: number;
    mimeType: string;
    createdAt: Date;
    createdById: string | null;
    contract: {
      id: string;
      number: string;
      customerId: string;
      customer: { legalName: string };
    };
  },
  users: Map<string, { id: string; firstName: string; lastName: string }>
): FileCenterItem {
  const fileName = `${row.contract.number}.pdf`;
  return {
    id: `contract_pdf:${row.id}`,
    source: "contract_pdf",
    sourceId: row.id,
    fileName,
    module: "CONTRACT",
    fileType: "PDF",
    customerId: row.contract.customerId,
    customerName: row.contract.customer.legalName,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    uploadedBy: row.createdById
      ? users.get(row.createdById) ?? null
      : null,
    entityId: row.contract.id,
    detailPath: `/contracts/${row.contract.id}`,
    viewUrl: `/api/files/contract-pdf/${row.id}?inline=1`,
    downloadUrl: `/api/files/contract-pdf/${row.id}`,
    canDelete: false,
  };
}

async function loadUsersMap(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, firstName: true, lastName: true },
  });
  return new Map(rows.map((u) => [u.id, u]));
}

function documentLinkToItem(
  row: {
    id: string;
    entityType: DocumentEntityType;
    entityId: string;
    createdAt: Date;
    document: {
      id: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
      relativePath: string;
      uploadedBy: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  },
  module: FileCenterModule,
  customer: { id: string; legalName: string },
  detailPath: string
): FileCenterItem {
  const doc = row.document;
  return {
    id: `document:${doc.id}`,
    source: "document",
    sourceId: doc.id,
    fileName: doc.originalName,
    module,
    fileType: mimeToFileType(doc.mimeType),
    customerId: customer.id,
    customerName: customer.legalName,
    sizeBytes: doc.sizeBytes,
    createdAt: doc.createdAt,
    uploadedBy: doc.uploadedBy,
    entityId: row.entityId,
    detailPath,
    viewUrl: `/api/files/document/${doc.id}?inline=1`,
    downloadUrl: `/api/files/document/${doc.id}`,
    canDelete: true,
  };
}

async function fetchQuotePdfs(
  user: SessionUser,
  query: FileCenterListQuery,
  take: number
): Promise<FileCenterItem[]> {
  if (query.module && query.module !== "QUOTE") return [];
  if (query.fileType === "ATTACHMENT") return [];

  const dateRange = buildDateRange(query);
  const where: Prisma.QuotePdfVersionWhereInput = {
    ...(dateRange ? { createdAt: dateRange } : {}),
    ...(query.uploadedById ? { createdById: query.uploadedById } : {}),
    quote: {
      deletedAt: null,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: normalizeSearch(query.q), mode: "insensitive" } },
              {
                customer: {
                  legalName: { contains: normalizeSearch(query.q), mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      ...(canAccessAllFiles(user) || hasRole(user, "VIEWER")
        ? {}
        : buildQuoteAccessFilter(user)),
    },
  };

  const rows = await prisma.quotePdfVersion.findMany({
    where,
    select: {
      id: true,
      sizeBytes: true,
      mimeType: true,
      createdAt: true,
      quote: {
        select: {
          id: true,
          number: true,
          customerId: true,
          customer: { select: { legalName: true } },
        },
      },
      createdById: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const users = await loadUsersMap(rows.map((r) => r.createdById ?? ""));
  return rows.map((r) => quotePdfToItem(r, users));
}

async function fetchContractPdfs(
  user: SessionUser,
  query: FileCenterListQuery,
  take: number
): Promise<FileCenterItem[]> {
  if (query.module && query.module !== "CONTRACT") return [];
  if (query.fileType === "ATTACHMENT") return [];

  const dateRange = buildDateRange(query);
  const contractFilter =
    canAccessAllFiles(user) || hasRole(user, "VIEWER")
      ? {}
      : buildContractAccessFilter(user);
  const where: Prisma.ContractPdfVersionWhereInput = {
    ...(dateRange ? { createdAt: dateRange } : {}),
    ...(query.uploadedById ? { createdById: query.uploadedById } : {}),
    contract: {
      deletedAt: null,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: normalizeSearch(query.q), mode: "insensitive" } },
              {
                customer: {
                  legalName: { contains: normalizeSearch(query.q), mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      ...(Object.keys(contractFilter).length ? contractFilter : {}),
    },
  };

  const rows = await prisma.contractPdfVersion.findMany({
    where,
    select: {
      id: true,
      sizeBytes: true,
      mimeType: true,
      createdAt: true,
      contract: {
        select: {
          id: true,
          number: true,
          customerId: true,
          customer: { select: { legalName: true } },
        },
      },
      createdById: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const users = await loadUsersMap(rows.map((r) => r.createdById ?? ""));
  return rows.map((r) => contractPdfToItem(r, users));
}

async function fetchDocumentLinks(
  user: SessionUser,
  query: FileCenterListQuery,
  take: number
): Promise<FileCenterItem[]> {
  const modules: FileCenterModule[] = query.module
    ? [query.module]
    : ["CUSTOMER", "SERVICE_TICKET", "VISIT", "CONTRACT"];

  const items: FileCenterItem[] = [];
  const dateRange = buildDateRange(query);

  for (const mod of modules) {
    if (mod === "QUOTE") continue;

    let entityTypes: DocumentEntityType[] = [];
    if (mod === "CUSTOMER") entityTypes = ["CUSTOMER"];
    if (mod === "SERVICE_TICKET") entityTypes = ["SERVICE_TICKET"];
    if (mod === "VISIT") entityTypes = ["VISIT"];
    if (mod === "CONTRACT") entityTypes = ["CONTRACT"];

    const where: Prisma.DocumentLinkWhereInput = {
      entityType: { in: entityTypes },
      document: {
        deletedAt: null,
        status: "ACTIVE",
        ...(query.fileType === "PDF"
          ? { mimeType: "application/pdf" }
          : query.fileType === "ATTACHMENT"
            ? { mimeType: { not: "application/pdf" } }
            : {}),
        ...(query.uploadedById ? { uploadedById: query.uploadedById } : {}),
        ...(dateRange ? { createdAt: dateRange } : {}),
        ...(query.q
          ? {
              OR: [
                { originalName: { contains: normalizeSearch(query.q), mode: "insensitive" } },
              ],
            }
          : {}),
        ...(mod === "CONTRACT"
          ? { relativePath: { contains: "/files/" } }
          : {}),
      },
    };

    const links = await prisma.documentLink.findMany({
      where,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        document: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
            relativePath: true,
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    for (const link of links) {
      const resolved = await resolveDocumentLinkContext(user, link);
      if (!resolved) continue;
      if (query.customerId && resolved.customer.id !== query.customerId) {
        continue;
      }
      if (query.q) {
        const qNorm = normalizeSearch(query.q);
        if (
          !normalizeSearch(resolved.customer.legalName).includes(qNorm) &&
          !normalizeSearch(link.document.originalName).includes(qNorm)
        ) {
          continue;
        }
      }
      items.push(
        documentLinkToItem(
          link,
          mod,
          resolved.customer,
          resolved.detailPath
        )
      );
    }
  }

  return items;
}

async function resolveDocumentLinkContext(
  user: SessionUser,
  link: {
    entityType: DocumentEntityType;
    entityId: string;
  }
): Promise<{ customer: { id: string; legalName: string }; detailPath: string } | null> {
  switch (link.entityType) {
    case "CUSTOMER": {
      const c = await prisma.customer.findFirst({
        where: { id: link.entityId, deletedAt: null },
        select: { id: true, legalName: true },
      });
      if (!c || !(await canAccessCustomer(user, c.id))) return null;
      return { customer: c, detailPath: `/customers/${c.id}?tab=files` };
    }
    case "CONTRACT": {
      const c = await prisma.contract.findFirst({
        where: {
          id: link.entityId,
          deletedAt: null,
          ...buildContractAccessFilter(user),
        },
        select: {
          id: true,
          customer: { select: { id: true, legalName: true } },
        },
      });
      if (!c) return null;
      return {
        customer: c.customer,
        detailPath: `/contracts/${c.id}?tab=files`,
      };
    }
    case "SERVICE_TICKET": {
      const t = await prisma.serviceTicket.findFirst({
        where: {
          id: link.entityId,
          deletedAt: null,
          ...buildServiceTicketAccessFilter(user),
        },
        select: {
          id: true,
          customer: { select: { id: true, legalName: true } },
        },
      });
      if (!t) return null;
      return {
        customer: t.customer,
        detailPath: `/service-tickets/${t.id}?tab=files`,
      };
    }
    case "VISIT": {
      const v = await prisma.visitRecord.findFirst({
        where: {
          id: link.entityId,
          deletedAt: null,
          ...buildVisitAccessFilter(user),
        },
        select: {
          id: true,
          customer: { select: { id: true, legalName: true } },
        },
      });
      if (!v) return null;
      return {
        customer: v.customer,
        detailPath: `/visits/${v.id}?tab=files`,
      };
    }
    default:
      return null;
  }
}

export async function listFileCenter(
  user: SessionUser,
  query: FileCenterListQuery
) {
  const cursor = decodeFileCenterCursor(query.cursor);
  const fetchSize = query.limit * 4;

  const [quotes, contracts, documents] = await Promise.all([
    fetchQuotePdfs(user, query, fetchSize),
    fetchContractPdfs(user, query, fetchSize),
    fetchDocumentLinks(user, query, fetchSize),
  ]);

  const merged = [...quotes, ...contracts, ...documents];
  const { items, hasMore, nextCursor } = applyCursorSlice(
    merged,
    cursor,
    query.limit
  );

  return {
    items,
    total: merged.length,
    hasMore,
    nextCursor,
    shown: items.length,
  };
}

export async function getFileCenterItem(
  user: SessionUser,
  source: FileCenterSource,
  sourceId: string
): Promise<FileCenterItem | null> {
  const list = await listFileCenter(user, {
    limit: 50,
    cursor: undefined,
  });
  return (
    list.items.find((i) => i.source === source && i.sourceId === sourceId) ??
    null
  );
}

export async function resolveFilePayload(
  user: SessionUser,
  source: "document" | "quote-pdf" | "contract-pdf",
  id: string
): Promise<{
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  customerId: string;
  documentId?: string;
} | null> {
  const storage = getStorageAdapter();

  if (source === "document") {
    const doc = await prisma.document.findFirst({
      where: { id, deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        relativePath: true,
        links: {
          select: { entityType: true, entityId: true },
          take: 1,
        },
      },
    });
    if (!doc || doc.links.length === 0) return null;
    const link = doc.links[0];
    const ctx = await resolveDocumentLinkContext(user, link);
    if (!ctx) return null;
    const buffer = await storage.read(doc.relativePath);
    return {
      buffer,
      mimeType: doc.mimeType,
      fileName: doc.originalName,
      customerId: ctx.customer.id,
      documentId: doc.id,
    };
  }

  if (source === "quote-pdf") {
    const row = await prisma.quotePdfVersion.findFirst({
      where: { id },
      select: {
        relativePath: true,
        mimeType: true,
        quote: {
          select: {
            id: true,
            number: true,
            customerId: true,
            deletedAt: true,
          },
        },
      },
    });
    if (!row || row.quote.deletedAt) return null;
    const allowed = await canAccessCustomer(user, row.quote.customerId);
    if (!allowed && !canAccessAllFiles(user)) return null;
    const buffer = await storage.read(row.relativePath);
    return {
      buffer,
      mimeType: row.mimeType,
      fileName: `${row.quote.number}.pdf`,
      customerId: row.quote.customerId,
    };
  }

  if (source === "contract-pdf") {
    const row = await prisma.contractPdfVersion.findFirst({
      where: {
        id,
        contract: { deletedAt: null, ...buildContractAccessFilter(user) },
      },
      select: {
        relativePath: true,
        mimeType: true,
        contract: {
          select: { id: true, number: true, customerId: true },
        },
      },
    });
    if (!row) return null;
    const buffer = await storage.read(row.relativePath);
    return {
      buffer,
      mimeType: row.mimeType,
      fileName: `${row.contract.number}.pdf`,
      customerId: row.contract.customerId,
    };
  }

  return null;
}

export async function logFileActivity(
  user: SessionUser,
  type: "FILE_VIEW" | "FILE_DOWNLOAD",
  params: {
    customerId: string;
    documentId?: string;
    fileName: string;
    module?: string;
  }
) {
  await createActivity({
    customerId: params.customerId,
    type,
    title: type === "FILE_VIEW" ? "Dosya görüntülendi" : "Dosya indirildi",
    description: params.fileName,
    userId: user.id,
    createdById: user.id,
    metadata: {
      documentId: params.documentId,
      module: params.module,
    },
  });
}

export async function softDeleteDocument(
  user: SessionUser,
  documentId: string
): Promise<boolean> {
  if (
    !hasPermission(user, "file:delete") ||
    (!isSuperAdmin(user) && !hasRole(user, "ADMIN"))
  ) {
    return false;
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      id: true,
      originalName: true,
      links: { select: { entityType: true, entityId: true }, take: 1 },
    },
  });
  if (!doc || doc.links.length === 0) return false;

  const link = doc.links[0];
  const ctx = await resolveDocumentLinkContext(user, link);
  if (!ctx) return false;

  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "file",
    entityId: documentId,
    changes: { fileName: doc.originalName, link },
  });

  await createActivity({
    customerId: ctx.customer.id,
    type: "OTHER",
    title: "Dosya silindi",
    description: doc.originalName,
    userId: user.id,
    createdById: user.id,
    metadata: { documentId },
  });

  return true;
}

export async function listRecentFilesForDashboard(
  user: SessionUser,
  limit = 5
) {
  const result = await listFileCenter(user, { limit: limit * 3 });
  return result.items.slice(0, limit);
}

export async function listCustomerFileCenterItems(
  user: SessionUser,
  customerId: string
) {
  const access = await canAccessCustomer(user, customerId);
  if (!access) return [];

  return listFileCenter(user, {
    customerId,
    limit: 50,
  }).then((r) => r.items);
}

export async function listEntityDocuments(
  user: SessionUser,
  entityType: DocumentEntityType,
  entityId: string
) {
  const moduleMap: Record<
    DocumentEntityType,
    FileCenterModule | null
  > = {
    CUSTOMER: "CUSTOMER",
    SERVICE_TICKET: "SERVICE_TICKET",
    VISIT: "VISIT",
    CONTRACT: "CONTRACT",
    QUOTE: null,
    TASK: null,
  };
  const mod = moduleMap[entityType];
  if (!mod) return [];

  const query: FileCenterListQuery = {
    limit: 50,
    module: mod,
  };

  const all = await listFileCenter(user, query);
  return all.items.filter((i) => i.entityId === entityId);
}

export async function listCustomersForFileFilter(user: SessionUser) {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (!canAccessAllFiles(user) && hasRole(user, "SALES")) {
    Object.assign(where, salesCustomerWhere(user));
  }

  return prisma.customer.findMany({
    where,
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function listUploadersForFileFilter() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });
}

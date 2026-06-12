import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type { VisitFormInput, VisitListQuery } from "@/lib/validations/visit";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { nextDocumentNumber } from "./number-sequence-service";
import { getCustomerForAccess } from "./customer-service";
import { refreshCustomerHealthCache } from "./customer-health-service";

export function buildVisitAccessFilter(
  user: SessionUser
): Prisma.VisitRecordWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  if (
    hasRole(user, "SALES") ||
    hasRole(user, "TECHNICIAN") ||
    hasRole(user, "FIELD_OPS")
  ) {
    return {
      ...cf,
      OR: [
        { userId: user.id },
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

export type VisitCursor = { createdAt: string; id: string };

export function encodeVisitCursor(c: VisitCursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeVisitCursor(raw?: string): VisitCursor | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as VisitCursor;
    if (p.createdAt && p.id) return p;
  } catch {
    return null;
  }
  return null;
}

const LIST_SELECT = {
  id: true,
  visitNo: true,
  visitDate: true,
  result: true,
  nextVisitDate: true,
  createdAt: true,
  customer: { select: { id: true, legalName: true } },
  user: { select: { id: true, firstName: true, lastName: true } },
} as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildListWhere(
  user: SessionUser,
  query: VisitListQuery
): Prisma.VisitRecordWhereInput {
  const where: Prisma.VisitRecordWhereInput = {
    deletedAt: null,
    ...buildVisitAccessFilter(user),
  };

  if (query.customerId) where.customerId = query.customerId;
  if (query.contractId) where.contractId = query.contractId;
  if (query.serviceTicketId) where.serviceTicketId = query.serviceTicketId;
  if (query.userId) where.userId = query.userId;

  if (query.upcoming) {
    const today = startOfDay(new Date());
    where.nextVisitDate = { gte: today };
  }

  if (query.dateFrom || query.dateTo) {
    where.visitDate = {};
    if (query.dateFrom) {
      where.visitDate.gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      where.visitDate.lte = end;
    }
  }

  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    where.OR = [
      { visitNo: { contains: term, mode: "insensitive" } },
      {
        customer: {
          legalName: { contains: term, mode: "insensitive" },
        },
      },
      { description: { contains: term, mode: "insensitive" } },
      { result: { contains: term, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listVisits(user: SessionUser, query: VisitListQuery) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeVisitCursor(query.cursor);

  const listWhere: Prisma.VisitRecordWhereInput = { ...where };
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

  const orderBy: Prisma.VisitRecordOrderByWithRelationInput[] = query.upcoming
    ? [{ nextVisitDate: "asc" }, { id: "asc" }]
    : [{ visitDate: "desc" }, { createdAt: "desc" }, { id: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.visitRecord.count({ where }),
    prisma.visitRecord.findMany({
      where: listWhere,
      select: LIST_SELECT,
      orderBy,
      take: limit + 1,
    }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeVisitCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getVisitAccess(user: SessionUser, visitId: string) {
  return prisma.visitRecord.findFirst({
    where: {
      id: visitId,
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: { id: true, customerId: true },
  });
}

export async function getVisitDetail(user: SessionUser, visitId: string) {
  return prisma.visitRecord.findFirst({
    where: {
      id: visitId,
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: {
      id: true,
      visitNo: true,
      visitDate: true,
      description: true,
      result: true,
      nextVisitDate: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: { id: true, legalName: true, tradeName: true },
      },
      contract: {
        select: { id: true, number: true, title: true },
      },
      serviceTicket: {
        select: { id: true, ticketNo: true, title: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });
}

async function validateVisitLinks(
  customerId: string,
  contractId?: string | null,
  serviceTicketId?: string | null
) {
  if (contractId) {
    const c = await prisma.contract.findFirst({
      where: { id: contractId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!c) throw new Error("Sözleşme bu müşteriye ait değil");
  }

  if (serviceTicketId) {
    const t = await prisma.serviceTicket.findFirst({
      where: { id: serviceTicketId, customerId, deletedAt: null },
      select: { id: true, contractId: true },
    });
    if (!t) throw new Error("Servis talebi bu müşteriye ait değil");
    if (contractId && t.contractId && t.contractId !== contractId) {
      throw new Error("Servis talebi seçilen sözleşme ile uyuşmuyor");
    }
  }
}

export async function createVisit(user: SessionUser, input: VisitFormInput) {
  const customer = await getCustomerForAccess(user, input.customerId);
  if (!customer) throw new Error("Müşteri bulunamadı veya erişim yok");

  const contractId = input.contractId?.trim() || null;
  const serviceTicketId = input.serviceTicketId?.trim() || null;
  await validateVisitLinks(input.customerId, contractId, serviceTicketId);

  const visitNo = await nextDocumentNumber("VISIT", user.companyId);

  const visit = await prisma.visitRecord.create({
    data: {
      companyId: user.companyId ?? undefined,
      visitNo,
      customerId: input.customerId,
      contractId,
      serviceTicketId,
      userId: input.userId,
      visitDate: new Date(input.visitDate),
      description: input.description.trim(),
      result: input.result?.trim() || null,
      nextVisitDate: input.nextVisitDate
        ? new Date(input.nextVisitDate)
        : null,
      createdById: user.id,
      updatedById: user.id,
    },
    select: { id: true, visitNo: true, customerId: true },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "visit",
    entityId: visit.id,
    changes: { visitNo, customerId: input.customerId },
  });

  await createActivity({
    customerId: visit.customerId,
    type: "VISIT_RECORDED",
    title: "Saha ziyareti kaydedildi",
    description: `${visit.visitNo} — ${input.visitDate}`,
    userId: user.id,
    createdById: user.id,
    visitRecordId: visit.id,
    serviceTicketId: serviceTicketId ?? undefined,
    contractId: contractId ?? undefined,
  });

  await refreshCustomerHealthCache(visit.customerId);

  return visit.id;
}

export async function updateVisit(
  user: SessionUser,
  visitId: string,
  input: VisitFormInput
) {
  const existing = await prisma.visitRecord.findFirst({
    where: {
      id: visitId,
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: { id: true, customerId: true },
  });
  if (!existing) return null;

  const contractId = input.contractId?.trim() || null;
  const serviceTicketId = input.serviceTicketId?.trim() || null;
  await validateVisitLinks(input.customerId, contractId, serviceTicketId);

  await prisma.visitRecord.update({
    where: { id: visitId },
    data: {
      customerId: input.customerId,
      contractId,
      serviceTicketId,
      userId: input.userId,
      visitDate: new Date(input.visitDate),
      description: input.description.trim(),
      result: input.result?.trim() || null,
      nextVisitDate: input.nextVisitDate
        ? new Date(input.nextVisitDate)
        : null,
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "visit",
    entityId: visitId,
    changes: { visitDate: input.visitDate },
  });

  await createActivity({
    customerId: existing.customerId,
    type: "VISIT_UPDATED",
    title: "Saha ziyareti güncellendi",
    userId: user.id,
    createdById: user.id,
    visitRecordId: visitId,
  });

  await refreshCustomerHealthCache(existing.customerId);

  return visitId;
}

export async function listVisitActivities(
  user: SessionUser,
  visitId: string
) {
  const v = await getVisitAccess(user, visitId);
  if (!v) return [];

  return prisma.activity.findMany({
    where: { visitRecordId: visitId, deletedAt: null },
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

export async function listVisitAuditLogs(user: SessionUser, visitId: string) {
  const v = await getVisitAccess(user, visitId);
  if (!v) return [];

  return prisma.auditLog.findMany({
    where: { entityType: "visit", entityId: visitId },
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

export async function listCustomersForVisitSelect(user: SessionUser) {
  const filter =
    isSuperAdmin(user) || hasRole(user, "ADMIN")
      ? { deletedAt: null }
      : hasRole(user, "VIEWER")
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
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function listContractsForVisitSelect(
  user: SessionUser,
  customerId: string
) {
  return prisma.contract.findMany({
    where: { customerId, deletedAt: null },
    select: { id: true, number: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listServiceTicketsForVisitSelect(
  user: SessionUser,
  customerId: string
) {
  return prisma.serviceTicket.findMany({
    where: { customerId, deletedAt: null },
    select: { id: true, ticketNo: true, title: true, contractId: true },
    orderBy: { openedAt: "desc" },
    take: 100,
  });
}

export async function listUsersForVisitAssign() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });
}

export async function listCustomerVisits(
  user: SessionUser,
  customerId: string,
  limit = 20
) {
  const customer = await getCustomerForAccess(user, customerId);
  if (!customer) return [];

  return prisma.visitRecord.findMany({
    where: {
      customerId,
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: {
      id: true,
      visitNo: true,
      visitDate: true,
      result: true,
      nextVisitDate: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { visitDate: "desc" },
    take: limit,
  });
}

export async function listServiceTicketVisits(
  user: SessionUser,
  serviceTicketId: string,
  limit = 20
) {
  return prisma.visitRecord.findMany({
    where: {
      serviceTicketId,
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: {
      id: true,
      visitNo: true,
      visitDate: true,
      result: true,
      nextVisitDate: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { visitDate: "desc" },
    take: limit,
  });
}

export async function listRecentVisitsForDashboard(
  user: SessionUser,
  limit = 8
) {
  return prisma.visitRecord.findMany({
    where: {
      deletedAt: null,
      ...buildVisitAccessFilter(user),
    },
    select: {
      id: true,
      visitNo: true,
      visitDate: true,
      customer: { select: { id: true, legalName: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { visitDate: "desc" },
    take: limit,
  });
}

export async function listUpcomingVisitsForDashboard(
  user: SessionUser,
  limit = 8
) {
  const today = startOfDay(new Date());
  return prisma.visitRecord.findMany({
    where: {
      deletedAt: null,
      nextVisitDate: { gte: today },
      ...buildVisitAccessFilter(user),
    },
    select: {
      id: true,
      visitNo: true,
      nextVisitDate: true,
      customer: { select: { id: true, legalName: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { nextVisitDate: "asc" },
    take: limit,
  });
}

import type { ActivityType, Currency, Prisma, ServiceTicketStatus } from "@prisma/client";
import { calculateTotals } from "@/lib/quotes/calculations";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type {
  ServiceTicketFormInput,
  ServiceTicketListQuery,
} from "@/lib/validations/service-ticket";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { nextDocumentNumber } from "./number-sequence-service";
import {
  assertTransition,
  isServiceTicketEditable,
} from "./service-ticket-state-machine";
import { getCustomerForAccess } from "./customer-service";
import { refreshCustomerHealthCache } from "./customer-health-service";

async function upsertServiceTicketLineItems(
  tx: Prisma.TransactionClient,
  serviceTicketId: string,
  items: { description: string; quantity: number; unit?: string; unitPrice: number; taxRate: number }[]
) {
  await tx.serviceTicketLineItem.deleteMany({ where: { serviceTicketId } });
  if (!items.length) return;
  await tx.serviceTicketLineItem.createMany({
    data: items.map((item, i) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const lineTotal = qty * price * (1 + Number(item.taxRate) / 100);
      return {
        serviceTicketId,
        sortOrder: i,
        description: item.description.trim(),
        quantity: qty.toString(),
        unit: item.unit || "adet",
        unitPrice: price.toString(),
        taxRate: item.taxRate.toString(),
        lineTotal: lineTotal.toString(),
      };
    }),
  });
}

export function buildServiceTicketAccessFilter(
  user: SessionUser
): Prisma.ServiceTicketWhereInput {
  if (isSuperAdmin(user) || hasRole(user, "ADMIN")) return {};
  if (
    hasRole(user, "SALES") ||
    hasRole(user, "TECHNICIAN") ||
    hasRole(user, "FIELD_OPS")
  ) {
    return {
      OR: [
        { assignedUserId: user.id },
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

export type ServiceTicketCursor = { createdAt: string; id: string };

export function encodeServiceTicketCursor(c: ServiceTicketCursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeServiceTicketCursor(
  raw?: string
): ServiceTicketCursor | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as ServiceTicketCursor;
    if (p.createdAt && p.id) return p;
  } catch {
    return null;
  }
  return null;
}

const LIST_SELECT = {
  id: true,
  ticketNo: true,
  title: true,
  status: true,
  priority: true,
  serviceType: true,
  systemType: true,
  total: true,
  currency: true,
  openedAt: true,
  createdAt: true,
  customer: { select: { id: true, legalName: true } },
  assignedUser: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

function buildListWhere(
  user: SessionUser,
  query: ServiceTicketListQuery
): Prisma.ServiceTicketWhereInput {
  const where: Prisma.ServiceTicketWhereInput = {
    deletedAt: null,
    ...buildServiceTicketAccessFilter(user),
  };
  if (query.status) where.status = query.status;
  if (query.serviceType) where.serviceType = query.serviceType;
  if (query.priority) where.priority = query.priority;
  if (query.customerId) where.customerId = query.customerId;
  if (query.assignedUserId) where.assignedUserId = query.assignedUserId;
  if (query.dateFrom) where.openedAt = { ...where.openedAt as object, gte: new Date(query.dateFrom) };
  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    where.openedAt = { ...where.openedAt as object, lte: end };
  }
  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    where.OR = [
      { ticketNo: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      {
        customer: {
          legalName: { contains: term, mode: "insensitive" },
        },
      },
    ];
  }
  return where;
}

export async function listServiceTickets(
  user: SessionUser,
  query: ServiceTicketListQuery
) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeServiceTicketCursor(query.cursor);

  const listWhere: Prisma.ServiceTicketWhereInput = { ...where };
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
    prisma.serviceTicket.count({ where }),
    prisma.serviceTicket.findMany({
      where: listWhere,
      select: LIST_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
        ? encodeServiceTicketCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getServiceTicketAccess(
  user: SessionUser,
  serviceTicketId: string
) {
  return prisma.serviceTicket.findFirst({
    where: {
      id: serviceTicketId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true },
  });
}

export async function getServiceTicketDetail(
  user: SessionUser,
  serviceTicketId: string
) {
  return prisma.serviceTicket.findFirst({
    where: {
      id: serviceTicketId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: {
      id: true,
      ticketNo: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      serviceType: true,
      systemType: true,
      brand: true,
      model: true,
      serialNo: true,
      location: true,
      inventoryNo: true,
      workDone: true,
      techNotes: true,
      currency: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      openedAt: true,
      closedAt: true,
      customer: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          addresses: {
            select: { line1: true, line2: true, city: true, district: true },
            where: { type: "HEADQUARTERS" },
            take: 1,
          },
          contacts: {
            select: { fullName: true, phone: true, email: true },
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      contract: {
        select: { id: true, number: true, title: true },
      },
      assignedUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      lineItems: {
        select: {
          id: true,
          sortOrder: true,
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      pdfVersions: {
        select: { id: true, version: true, createdAt: true, relativePath: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function logServiceActivity(
  customerId: string,
  serviceTicketId: string,
  userId: string,
  type: ActivityType,
  title: string,
  description?: string
) {
  await createActivity({
    customerId,
    type,
    title,
    description,
    userId,
    createdById: userId,
    serviceTicketId,
  });
}

export async function createServiceTicket(
  user: SessionUser,
  input: ServiceTicketFormInput
) {
  const customer = await getCustomerForAccess(user, input.customerId);
  if (!customer) throw new Error("Müşteri bulunamadı veya erişim yok");

  const contractId = input.contractId?.trim() || null;
  if (contractId) {
    const c = await prisma.contract.findFirst({
      where: {
        id: contractId,
        customerId: input.customerId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!c) throw new Error("Sözleşme bu müşteriye ait değil");
  }

  const ticketNo = await nextDocumentNumber("SERVICE");
  const assignedUserId = input.assignedUserId?.trim() || null;
  const { subtotal, taxTotal, total } = calculateTotals(input.lineItems ?? []);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceTicket.create({
      data: {
        ticketNo,
        customerId: input.customerId,
        contractId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        workDone: input.workDone?.trim() || null,
        techNotes: input.techNotes?.trim() || null,
        priority: input.priority,
        serviceType: input.serviceType,
        systemType: input.systemType ?? null,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        serialNo: input.serialNo?.trim() || null,
        location: input.location?.trim() || null,
        inventoryNo: input.inventoryNo?.trim() || null,
        currency: (input.currency ?? "TRY") as Currency,
        subtotal: subtotal.toString(),
        taxTotal: taxTotal.toString(),
        total: total.toString(),
        status: "OPEN",
        assignedUserId,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, ticketNo: true, customerId: true },
    });
    await upsertServiceTicketLineItems(tx, created.id, input.lineItems ?? []);
    return created;
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "service_ticket",
    entityId: ticket.id,
    changes: { ticketNo, title: input.title },
  });

  await logServiceActivity(
    ticket.customerId,
    ticket.id,
    user.id,
    "SERVICE_TICKET_CREATED",
    "Servis talebi oluşturuldu",
    `${ticket.ticketNo} — ${input.title}`
  );

  if (assignedUserId) {
    await logServiceActivity(
      ticket.customerId,
      ticket.id,
      user.id,
      "SERVICE_TICKET_ASSIGNED",
      "Servis talebine personel atandı"
    );
  }

  await refreshCustomerHealthCache(ticket.customerId);

  return ticket.id;
}

export async function updateServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  input: ServiceTicketFormInput
) {
  const existing = await prisma.serviceTicket.findFirst({
    where: {
      id: serviceTicketId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: { id: true, status: true, customerId: true },
  });
  if (!existing) return null;
  if (!isServiceTicketEditable(existing.status)) {
    throw new Error("Bu durumdaki servis talebi düzenlenemez");
  }

  const contractId = input.contractId?.trim() || null;
  const { subtotal, taxTotal, total } = calculateTotals(input.lineItems ?? []);

  await prisma.$transaction(async (tx) => {
    await tx.serviceTicket.update({
      where: { id: serviceTicketId },
      data: {
        title: input.title.trim(),
        customerId: input.customerId,
        contractId,
        description: input.description?.trim() || null,
        workDone: input.workDone?.trim() || null,
        techNotes: input.techNotes?.trim() || null,
        priority: input.priority,
        serviceType: input.serviceType,
        systemType: input.systemType ?? null,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        serialNo: input.serialNo?.trim() || null,
        location: input.location?.trim() || null,
        inventoryNo: input.inventoryNo?.trim() || null,
        currency: (input.currency ?? "TRY") as Currency,
        subtotal: subtotal.toString(),
        taxTotal: taxTotal.toString(),
        total: total.toString(),
        updatedById: user.id,
      },
    });
    await upsertServiceTicketLineItems(tx, serviceTicketId, input.lineItems ?? []);
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "service_ticket",
    entityId: serviceTicketId,
    changes: { title: input.title },
  });

  await logServiceActivity(
    existing.customerId,
    serviceTicketId,
    user.id,
    "SERVICE_TICKET_UPDATED",
    "Servis talebi güncellendi",
    input.title
  );

  await refreshCustomerHealthCache(existing.customerId);

  return serviceTicketId;
}

const STATUS_ACTIVITY: Partial<
  Record<ServiceTicketStatus, { type: ActivityType; title: string }>
> = {
  IN_PROGRESS: {
    type: "SERVICE_TICKET_STATUS_CHANGED",
    title: "Servis talebi işleme alındı",
  },
  WAITING_CUSTOMER: {
    type: "SERVICE_TICKET_STATUS_CHANGED",
    title: "Müşteri yanıtı bekleniyor",
  },
  RESOLVED: {
    type: "SERVICE_TICKET_STATUS_CHANGED",
    title: "Servis talebi çözüldü",
  },
  CLOSED: {
    type: "SERVICE_TICKET_CLOSED",
    title: "Servis talebi kapatıldı",
  },
};

async function transitionServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  to: ServiceTicketStatus,
  extra: Prisma.ServiceTicketUncheckedUpdateInput = {},
  reason?: string
) {
  const ticket = await prisma.serviceTicket.findFirst({
    where: {
      id: serviceTicketId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: {
      id: true,
      status: true,
      customerId: true,
      ticketNo: true,
    },
  });
  if (!ticket) return null;

  assertTransition(ticket.status, to);

  const closedAt =
    to === "CLOSED" ? new Date() : extra.closedAt ?? undefined;

  await prisma.serviceTicket.update({
    where: { id: serviceTicketId },
    data: {
      status: to,
      updatedById: user.id,
      ...(closedAt ? { closedAt } : {}),
      ...extra,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "service_ticket",
    entityId: serviceTicketId,
    changes: { from: ticket.status, to, reason: reason ?? null },
  });

  const activity = STATUS_ACTIVITY[to];
  if (activity) {
    await logServiceActivity(
      ticket.customerId,
      serviceTicketId,
      user.id,
      activity.type,
      activity.title,
      reason
    );
  }

  await refreshCustomerHealthCache(ticket.customerId);

  return ticket;
}

export async function startServiceTicket(
  user: SessionUser,
  serviceTicketId: string
) {
  return transitionServiceTicket(user, serviceTicketId, "IN_PROGRESS");
}

export async function waitCustomerServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  reason?: string
) {
  return transitionServiceTicket(
    user,
    serviceTicketId,
    "WAITING_CUSTOMER",
    {},
    reason
  );
}

export async function resumeServiceTicket(
  user: SessionUser,
  serviceTicketId: string
) {
  const ticket = await prisma.serviceTicket.findFirst({
    where: { id: serviceTicketId, deletedAt: null },
    select: { status: true },
  });
  if (!ticket) return null;
  if (ticket.status === "WAITING_CUSTOMER") {
    return transitionServiceTicket(user, serviceTicketId, "IN_PROGRESS");
  }
  return null;
}

export async function resolveServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  reason?: string
) {
  return transitionServiceTicket(
    user,
    serviceTicketId,
    "RESOLVED",
    {},
    reason
  );
}

export async function closeServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  reason?: string
) {
  return transitionServiceTicket(
    user,
    serviceTicketId,
    "CLOSED",
    { closedAt: new Date() },
    reason
  );
}

export async function assignServiceTicket(
  user: SessionUser,
  serviceTicketId: string,
  assignedUserId: string
) {
  const ticket = await prisma.serviceTicket.findFirst({
    where: {
      id: serviceTicketId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: { id: true, customerId: true, status: true },
  });
  if (!ticket) return null;
  if (ticket.status === "CLOSED") {
    throw new Error("Kapatılmış talebe personel atanamaz");
  }

  await prisma.serviceTicket.update({
    where: { id: serviceTicketId },
    data: { assignedUserId, updatedById: user.id },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "service_ticket",
    entityId: serviceTicketId,
    changes: { assignedUserId },
  });

  await logServiceActivity(
    ticket.customerId,
    serviceTicketId,
    user.id,
    "SERVICE_TICKET_ASSIGNED",
    "Servis talebine personel atandı"
  );

  return ticket;
}

export async function listServiceTicketActivities(
  user: SessionUser,
  serviceTicketId: string
) {
  const t = await getServiceTicketAccess(user, serviceTicketId);
  if (!t) return [];

  return prisma.activity.findMany({
    where: { serviceTicketId, deletedAt: null },
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

export async function listServiceTicketAuditLogs(
  user: SessionUser,
  serviceTicketId: string
) {
  const t = await getServiceTicketAccess(user, serviceTicketId);
  if (!t) return [];

  return prisma.auditLog.findMany({
    where: { entityType: "service_ticket", entityId: serviceTicketId },
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

export async function listCustomersForServiceSelect(user: SessionUser) {
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
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function listContractsForServiceSelect(
  user: SessionUser,
  customerId: string
) {
  return prisma.contract.findMany({
    where: {
      customerId,
      deletedAt: null,
      status: { in: ["SIGNED", "ACTIVE", "SUSPENDED"] },
    },
    select: { id: true, number: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listUsersForServiceAssign() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });
}

export async function listCustomerServiceTickets(
  user: SessionUser,
  customerId: string,
  limit = 20
) {
  const customer = await getCustomerForAccess(user, customerId);
  if (!customer) return [];

  return prisma.serviceTicket.findMany({
    where: {
      customerId,
      deletedAt: null,
      ...buildServiceTicketAccessFilter(user),
    },
    select: {
      id: true,
      ticketNo: true,
      title: true,
      status: true,
      priority: true,
      serviceType: true,
      total: true,
      currency: true,
      openedAt: true,
    },
    orderBy: { openedAt: "desc" },
    take: limit,
  });
}

export async function deleteServiceTicket(
  user: SessionUser,
  serviceTicketId: string
): Promise<string | null> {
  const existing = await prisma.serviceTicket.findFirst({
    where: { id: serviceTicketId, deletedAt: null },
    select: { id: true, ticketNo: true, status: true },
  });
  if (!existing) return null;

  await prisma.serviceTicket.update({
    where: { id: serviceTicketId },
    data: { deletedAt: new Date(), updatedById: user.id },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "service_ticket",
    entityId: serviceTicketId,
    changes: { ticketNo: existing.ticketNo, status: existing.status },
  });

  return existing.ticketNo;
}

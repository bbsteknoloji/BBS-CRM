import type { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import { createAuditLog } from "@/lib/audit/audit-service";
import { buildContractAccessFilter } from "@/lib/services/contract-service";
import { buildQuoteAccessFilter } from "@/lib/services/quote-service";
import type { TaskFormInput, TaskListQuery } from "@/lib/validations/task";

const OPEN_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS"];

const LIST_SELECT = {
  id: true,
  title: true,
  status: true,
  priority: true,
  startAt: true,
  dueAt: true,
  createdAt: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
  customer: { select: { id: true, legalName: true } },
} as const;

export function buildTaskAccessFilter(
  user: SessionUser
): Prisma.TaskWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  return {
    ...cf,
    OR: [{ assignedToId: user.id }, { createdById: user.id }],
  };
}

export type TaskCursor = { createdAt: string; id: string };

export function encodeTaskCursor(cursor: TaskCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeTaskCursor(raw?: string): TaskCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as TaskCursor;
    if (parsed.createdAt && parsed.id) return parsed;
  } catch {
    return null;
  }
  return null;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseOptionalDate(value?: string | null) {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildListWhere(
  user: SessionUser,
  query: TaskListQuery
): Prisma.TaskWhereInput {
  const access = buildTaskAccessFilter(user);
  const where: Prisma.TaskWhereInput = { deletedAt: null };

  const andParts: Prisma.TaskWhereInput[] = [];
  if (Object.keys(access).length > 0) andParts.push(access);

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assignedToId) where.assignedToId = query.assignedToId;

  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    andParts.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  if (andParts.length > 0) {
    where.AND = andParts;
  }

  return where;
}

export async function listTasks(user: SessionUser, query: TaskListQuery) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeTaskCursor(query.cursor);

  const listWhere: Prisma.TaskWhereInput = { ...where };
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
    prisma.task.count({ where }),
    prisma.task.findMany({
      where: listWhere,
      select: LIST_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    items: page,
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeTaskCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getTaskById(user: SessionUser, id: string) {
  return prisma.task.findFirst({
    where: { id, deletedAt: null, ...buildTaskAccessFilter(user) },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      startAt: true,
      dueAt: true,
      customerId: true,
      quoteId: true,
      contractId: true,
      assignedToId: true,
    },
  });
}

function taskRelationData(input: TaskFormInput) {
  return {
    customerId: input.customerId?.trim() || null,
    quoteId: input.quoteId?.trim() || null,
    contractId: input.contractId?.trim() || null,
  };
}

function completedAtForStatus(status: TaskFormInput["status"]) {
  return status === "COMPLETED" ? new Date() : null;
}

export async function createTask(user: SessionUser, input: TaskFormInput) {
  const created = await prisma.task.create({
    data: {
      companyId: user.companyId ?? undefined,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      startAt: parseOptionalDate(input.startAt),
      dueAt: parseOptionalDate(input.dueAt),
      assignedToId: input.assignedToId,
      ...taskRelationData(input),
      completedAt: completedAtForStatus(input.status),
      createdById: user.id,
      updatedById: user.id,
    },
    select: { id: true, title: true },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "task",
    entityId: created.id,
    changes: { title: created.title, status: input.status },
  });

  return created.id;
}

export async function updateTask(
  user: SessionUser,
  taskId: string,
  input: TaskFormInput
) {
  const existing = await getTaskById(user, taskId);
  if (!existing) return null;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      startAt: parseOptionalDate(input.startAt),
      dueAt: parseOptionalDate(input.dueAt),
      assignedToId: input.assignedToId,
      ...taskRelationData(input),
      completedAt: completedAtForStatus(input.status),
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "task",
    entityId: taskId,
    changes: { title: input.title, status: input.status },
  });

  return taskId;
}

export async function deleteTask(user: SessionUser, taskId: string) {
  const existing = await getTaskById(user, taskId);
  if (!existing) return null;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      deletedAt: new Date(),
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "task",
    entityId: taskId,
    changes: { title: existing.title },
  });

  return true;
}

export async function listUsersForTaskAssign() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });
}

export async function listCustomersForTaskSelect(user: SessionUser) {
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

export async function listQuotesForTaskSelect(
  user: SessionUser,
  customerId?: string
) {
  const where: Prisma.QuoteWhereInput = {
    deletedAt: null,
    ...buildQuoteAccessFilter(user),
  };
  if (customerId) where.customerId = customerId;

  return prisma.quote.findMany({
    where,
    select: { id: true, number: true, title: true, customerId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listContractsForTaskSelect(
  user: SessionUser,
  customerId?: string
) {
  const where: Prisma.ContractWhereInput = {
    deletedAt: null,
    ...buildContractAccessFilter(user),
  };
  if (customerId) where.customerId = customerId;

  return prisma.contract.findMany({
    where,
    select: { id: true, number: true, title: true, customerId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function taskToFormInput(
  task: NonNullable<Awaited<ReturnType<typeof getTaskById>>>
): TaskFormInput {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    startAt: task.startAt ? task.startAt.toISOString().slice(0, 10) : "",
    dueAt: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : "",
    assignedToId: task.assignedToId,
    customerId: task.customerId ?? "",
    quoteId: task.quoteId ?? "",
    contractId: task.contractId ?? "",
  };
}

export async function countOpenTasks(user: SessionUser) {
  return prisma.task.count({
    where: {
      deletedAt: null,
      status: { in: OPEN_STATUSES },
      ...buildTaskAccessFilter(user),
    },
  });
}

export async function countOverdueTasks(user: SessionUser) {
  const today = startOfDay(new Date());
  return prisma.task.count({
    where: {
      deletedAt: null,
      status: { in: OPEN_STATUSES },
      dueAt: { lt: today },
      ...buildTaskAccessFilter(user),
    },
  });
}

export async function listMyAssignedTasks(user: SessionUser, limit = 8) {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      assignedToId: user.id,
      status: { in: OPEN_STATUSES },
      ...buildTaskAccessFilter(user),
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

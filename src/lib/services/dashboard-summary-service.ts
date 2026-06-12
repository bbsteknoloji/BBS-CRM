import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import { getContractDashboardStats } from "./contract-dashboard-service";
import { listRiskyCustomers } from "./customer-health-service";
import { buildContractAccessFilter } from "./contract-service";
import {
  listRecentVisitsForDashboard,
  listUpcomingVisitsForDashboard,
} from "./visit-service";
import { listRecentFilesForDashboard } from "./file-center-service";
import {
  countOpenTasks,
  countOverdueTasks,
  listMyAssignedTasks,
} from "./task-service";

function buildCustomerAccessFilter(
  user: SessionUser
): Prisma.CustomerWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  if (hasRole(user, "SALES")) {
    return {
      ...cf,
      OR: [
        { assignedToId: user.id },
        { createdById: user.id },
      ],
    };
  }
  return { id: "00000000-0000-0000-0000-000000000000" };
}

function buildServiceAccessFilter(
  user: SessionUser
): Prisma.ServiceTicketWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  if (hasRole(user, "SALES") || hasRole(user, "TECHNICIAN") || hasRole(user, "FIELD_OPS")) {
    return {
      ...cf,
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

function buildQuoteAccessFilter(user: SessionUser): Prisma.QuoteWhereInput {
  if (isSuperAdmin(user)) return {};
  const cf = user.companyId ? { companyId: user.companyId } : {};
  if (hasRole(user, "ADMIN")) return cf;
  if (hasRole(user, "SALES")) {
    return {
      ...cf,
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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export type DashboardSummary = {
  totalCustomers: number;
  activeContracts: number;
  expiringThisMonth: number;
  openServiceTickets: number;
  pendingQuotes: number;
  monthlyContractRevenue: number;
  contractStats: Awaited<ReturnType<typeof getContractDashboardStats>> | null;
  riskyCustomers: Array<{
    id: string;
    legalName: string;
    healthStatus: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    occurredAt: Date;
    customer: { legalName: string };
  }>;
  openTasks: number;
  overdueTasks: number;
  myAssignedTasks: Awaited<ReturnType<typeof listMyAssignedTasks>>;
  recentVisits: Awaited<ReturnType<typeof listRecentVisitsForDashboard>>;
  upcomingVisits: Awaited<ReturnType<typeof listUpcomingVisitsForDashboard>>;
  recentFiles: Awaited<ReturnType<typeof listRecentFilesForDashboard>>;
};

export async function getDashboardSummary(
  user: SessionUser,
  options: {
    canCustomers: boolean;
    canContracts: boolean;
    canQuotes: boolean;
    canService: boolean;
    canTasks: boolean;
    canVisits: boolean;
    canFiles: boolean;
  }
): Promise<DashboardSummary> {
  const customerAccess = buildCustomerAccessFilter(user);
  const contractAccess = buildContractAccessFilter(user);
  const serviceAccess = buildServiceAccessFilter(user);
  const quoteAccess = buildQuoteAccessFilter(user);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const safe = <T>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch(() => fallback);

  const [
    totalCustomers,
    activeContracts,
    expiringThisMonth,
    openServiceTickets,
    pendingQuotes,
    revenueAgg,
    contractStats,
    riskyCustomers,
    recentActivities,
    openTasks,
    overdueTasks,
    myAssignedTasks,
    recentVisits,
    upcomingVisits,
    recentFiles,
  ] = await Promise.all([
    safe(
      options.canCustomers
        ? prisma.customer.count({ where: { deletedAt: null, ...customerAccess } })
        : Promise.resolve(0),
      0
    ),
    safe(
      options.canContracts
        ? prisma.contract.count({ where: { deletedAt: null, status: "ACTIVE", ...contractAccess } })
        : Promise.resolve(0),
      0
    ),
    safe(
      options.canContracts
        ? prisma.contract.count({
            where: { deletedAt: null, status: "ACTIVE", endDate: { gte: monthStart, lte: monthEnd }, ...contractAccess },
          })
        : Promise.resolve(0),
      0
    ),
    safe(
      options.canService
        ? prisma.serviceTicket.count({
            where: { deletedAt: null, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] }, ...serviceAccess },
          })
        : Promise.resolve(0),
      0
    ),
    safe(
      options.canQuotes
        ? prisma.quote.count({ where: { deletedAt: null, status: { in: ["SENT", "REVISION"] }, ...quoteAccess } })
        : Promise.resolve(0),
      0
    ),
    safe(
      options.canContracts
        ? prisma.contract.aggregate({ where: { deletedAt: null, status: "ACTIVE", ...contractAccess }, _sum: { total: true } })
        : Promise.resolve({ _sum: { total: null } }),
      { _sum: { total: null } }
    ),
    safe(
      options.canContracts ? getContractDashboardStats(user) : Promise.resolve(null),
      null
    ),
    safe(
      options.canCustomers ? listRiskyCustomers(customerAccess, 8) : Promise.resolve([]),
      []
    ),
    safe(
      options.canCustomers
        ? prisma.activity.findMany({
            where: { deletedAt: null, customer: { deletedAt: null, ...customerAccess } },
            select: { id: true, type: true, title: true, occurredAt: true, customer: { select: { legalName: true } } },
            orderBy: { occurredAt: "desc" },
            take: 12,
          })
        : Promise.resolve([]),
      []
    ),
    safe(options.canTasks ? countOpenTasks(user) : Promise.resolve(0), 0),
    safe(options.canTasks ? countOverdueTasks(user) : Promise.resolve(0), 0),
    safe(options.canTasks ? listMyAssignedTasks(user, 8) : Promise.resolve([]), []),
    safe(options.canVisits ? listRecentVisitsForDashboard(user, 8) : Promise.resolve([]), []),
    safe(options.canVisits ? listUpcomingVisitsForDashboard(user, 8) : Promise.resolve([]), []),
    safe(options.canFiles ? listRecentFilesForDashboard(user, 5) : Promise.resolve([]), []),
  ]);

  return {
    totalCustomers,
    activeContracts,
    expiringThisMonth,
    openServiceTickets,
    pendingQuotes,
    monthlyContractRevenue: Number(revenueAgg._sum.total?.toString() ?? 0),
    contractStats,
    riskyCustomers,
    recentActivities,
    openTasks,
    overdueTasks,
    myAssignedTasks,
    recentVisits,
    upcomingVisits,
    recentFiles,
  };
}

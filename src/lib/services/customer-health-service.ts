import type { CustomerHealthStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const HEALTH_STATUS_LABELS: Record<CustomerHealthStatus, string> = {
  HEALTHY: "Sağlıklı",
  WARNING: "Dikkat",
  RISK: "Riskli",
};

const OPEN_SERVICE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
] as const;

const MS_DAY = 86400000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type HealthSignals = {
  activeContractCount: number;
  openServiceCount: number;
  daysSinceLastVisit: number | null;
  overdueTaskCount: number;
  expiringContractWithin30Days: number;
};

export type HealthResult = {
  status: CustomerHealthStatus;
  signals: HealthSignals;
  warningCount: number;
  criticalCount: number;
};

/** Faz 5 analiz eşikleri */
export function computeHealthFromSignals(signals: HealthSignals): HealthResult {
  let warningCount = 0;
  let criticalCount = 0;

  if (signals.activeContractCount === 0) criticalCount += 1;
  if (signals.openServiceCount >= 3) criticalCount += 1;
  else if (signals.openServiceCount >= 1) warningCount += 1;

  if (signals.daysSinceLastVisit !== null) {
    if (signals.daysSinceLastVisit > 180) criticalCount += 1;
    else if (signals.daysSinceLastVisit > 90) warningCount += 1;
  } else {
    warningCount += 1;
  }

  if (signals.overdueTaskCount >= 1) warningCount += 1;
  if (signals.expiringContractWithin30Days >= 1) warningCount += 1;

  let status: CustomerHealthStatus = "HEALTHY";
  if (
    criticalCount >= 2 ||
    (signals.activeContractCount === 0 && signals.openServiceCount >= 1)
  ) {
    status = "RISK";
  } else if (criticalCount >= 1 || warningCount >= 2) {
    status = "WARNING";
  } else if (warningCount <= 1) {
    status = "HEALTHY";
  }

  return { status, signals, warningCount, criticalCount };
}

export async function loadHealthSignals(
  customerId: string
): Promise<HealthSignals> {
  const today = startOfDay(new Date());
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  const [
    activeContractCount,
    openServiceCount,
    lastVisit,
    overdueTaskCount,
    expiringContractWithin30Days,
  ] = await Promise.all([
    prisma.contract.count({
      where: { customerId, deletedAt: null, status: "ACTIVE" },
    }),
    prisma.serviceTicket.count({
      where: {
        customerId,
        deletedAt: null,
        status: { in: [...OPEN_SERVICE_STATUSES] },
      },
    }),
    prisma.visitRecord.findFirst({
      where: { customerId, deletedAt: null },
      orderBy: { visitDate: "desc" },
      select: { visitDate: true },
    }),
    prisma.task.count({
      where: {
        customerId,
        deletedAt: null,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lt: today },
      },
    }),
    prisma.contract.count({
      where: {
        customerId,
        deletedAt: null,
        status: "ACTIVE",
        endDate: { gte: today, lte: in30 },
      },
    }),
  ]);

  const daysSinceLastVisit = lastVisit
    ? Math.floor((today.getTime() - lastVisit.visitDate.getTime()) / MS_DAY)
    : null;

  return {
    activeContractCount,
    openServiceCount,
    daysSinceLastVisit,
    overdueTaskCount,
    expiringContractWithin30Days,
  };
}

export async function computeCustomerHealth(
  customerId: string
): Promise<HealthResult> {
  const signals = await loadHealthSignals(customerId);
  return computeHealthFromSignals(signals);
}

export async function refreshCustomerHealthCache(customerId: string) {
  const result = await computeCustomerHealth(customerId);
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      healthStatus: result.status,
      healthComputedAt: new Date(),
    },
  });
  return result;
}

export async function listRiskyCustomers(
  access: Prisma.CustomerWhereInput,
  limit = 10
) {
  return prisma.customer.findMany({
    where: {
      deletedAt: null,
      healthStatus: "RISK",
      ...access,
    },
    select: {
      id: true,
      legalName: true,
      healthStatus: true,
    },
    orderBy: { healthComputedAt: "desc" },
    take: limit,
  });
}

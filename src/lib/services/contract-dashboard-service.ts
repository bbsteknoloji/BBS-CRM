import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { buildContractAccessFilter } from "./contract-service";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(base: Date, days: number) {
  const x = new Date(base);
  x.setDate(x.getDate() + days);
  return x;
}

const EXPIRY_BUCKETS = [90, 60, 30, 15, 7] as const;

export type ContractExpiryBuckets = Record<
  (typeof EXPIRY_BUCKETS)[number],
  number
> & { overdue: number };

export type ContractDashboardStats = {
  activeTotal: number;
  expiringThisMonth: number;
  overdueCount: number;
  renewedTotal: number;
  expiryBuckets: ContractExpiryBuckets;
};

function activeExpiringWhere(
  access: Prisma.ContractWhereInput,
  from: Date,
  to: Date
): Prisma.ContractWhereInput {
  return {
    deletedAt: null,
    status: "ACTIVE",
    endDate: { gte: from, lte: to },
    ...access,
  };
}

export async function getContractDashboardStats(
  user: SessionUser
): Promise<ContractDashboardStats> {
  const access = buildContractAccessFilter(user);
  const today = startOfDay(new Date());
  const monthEnd = endOfMonth(today);
  const in90 = addDays(today, 90);

  // 5 ayrı bucket COUNT yerine tek findMany + JS — 5 DB round-trip kazanımı
  const [activeTotal, renewedTotal, overdueCount, expiringThisMonth, expiringRows] =
    await Promise.all([
      prisma.contract.count({
        where: { deletedAt: null, status: "ACTIVE", ...access },
      }),
      prisma.contract.count({
        where: { deletedAt: null, status: "RENEWED", ...access },
      }),
      prisma.contract.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          endDate: { lt: today },
          ...access,
        },
      }),
      prisma.contract.count({
        where: activeExpiringWhere(access, today, monthEnd),
      }),
      prisma.contract.findMany({
        where: { deletedAt: null, status: "ACTIVE", endDate: { gte: today, lte: in90 }, ...access },
        select: { endDate: true },
      }),
    ]);

  const bucketCount = (days: number) =>
    expiringRows.filter((r) => r.endDate != null && r.endDate <= addDays(today, days)).length;

  const expiryBuckets = {
    90: expiringRows.length,
    60: bucketCount(60),
    30: bucketCount(30),
    15: bucketCount(15),
    7: bucketCount(7),
    overdue: overdueCount,
  } as ContractExpiryBuckets;

  return {
    activeTotal,
    expiringThisMonth,
    overdueCount,
    renewedTotal,
    expiryBuckets,
  };
}

export { EXPIRY_BUCKETS };

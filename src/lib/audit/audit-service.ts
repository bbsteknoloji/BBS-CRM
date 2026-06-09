import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditParams = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes ?? undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

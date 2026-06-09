import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type CreateActivityParams = {
  customerId: string;
  type: ActivityType;
  title: string;
  description?: string;
  userId?: string;
  createdById?: string;
  taskId?: string;
  quoteId?: string;
  contractId?: string;
  serviceTicketId?: string;
  visitRecordId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createActivity(params: CreateActivityParams) {
  return prisma.activity.create({
    data: {
      customerId: params.customerId,
      type: params.type,
      title: params.title,
      description: params.description,
      userId: params.userId,
      createdById: params.createdById,
      taskId: params.taskId,
      quoteId: params.quoteId,
      contractId: params.contractId,
      serviceTicketId: params.serviceTicketId,
      visitRecordId: params.visitRecordId,
      metadata: params.metadata,
    },
    select: { id: true },
  });
}

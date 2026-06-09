import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { nextDocumentNumber } from "./number-sequence-service";
import {
  assertTransition,
} from "./contract-state-machine";
import {
  buildContractAccessFilter,
  getContractAccess,
} from "./contract-service";
import {
  calculateTotals,
  toDecimalString,
  type LineInput,
} from "@/lib/quotes/calculations";

type RenewInput = {
  contractId: string;
  newStartDate: string;
  newEndDate?: string;
  notes?: string;
};

export async function renewContract(
  user: SessionUser,
  input: RenewInput
) {
  const access = await getContractAccess(user, input.contractId);
  if (!access) return null;
  if (access.status !== "ACTIVE") {
    throw new Error("Yalnızca aktif sözleşmeler yenilenebilir");
  }

  const source = await prisma.contract.findFirst({
    where: {
      id: input.contractId,
      deletedAt: null,
      ...buildContractAccessFilter(user),
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!source) return null;

  assertTransition(source.status, "RENEWED");

  const newNumber = await nextDocumentNumber("CONTRACT");
  const newStartDate = new Date(input.newStartDate);
  const newEndDate = input.newEndDate
    ? new Date(input.newEndDate)
    : source.endDate;

  const lineInputs: LineInput[] = source.lineItems.map((l) => ({
    quantity: Number(l.quantity.toString()),
    unitPrice: Number(l.unitPrice.toString()),
    taxRate: Number(l.taxRate.toString()),
  }));
  const { subtotal, taxTotal, total } = calculateTotals(lineInputs);

  const result = await prisma.$transaction(async (tx) => {
    const newContract = await tx.contract.create({
      data: {
        number: newNumber,
        customerId: source.customerId,
        quoteId: source.quoteId,
        title: source.title,
        status: "DRAFT",
        currency: source.currency,
        startDate: newStartDate,
        endDate: newEndDate,
        autoRenew: source.autoRenew,
        renewalNoticeDays: source.renewalNoticeDays,
        subtotal: toDecimalString(subtotal),
        taxTotal: toDecimalString(taxTotal),
        total: toDecimalString(total),
        notes: source.notes,
        terms: source.terms,
        ownerId: source.ownerId,
        parentContractId: source.id,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, number: true },
    });

    for (let i = 0; i < source.lineItems.length; i++) {
      const line = source.lineItems[i];
      await tx.contractLineItem.create({
        data: {
          contractId: newContract.id,
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

    await tx.contract.update({
      where: { id: source.id },
      data: {
        status: "RENEWED",
        updatedById: user.id,
      },
    });

    await tx.contractRenewal.create({
      data: {
        contractId: source.id,
        newContractId: newContract.id,
        status: "COMPLETED",
        previousEndDate: source.endDate ?? newStartDate,
        newStartDate,
        newEndDate,
        newTotal: source.total,
        notes: input.notes?.trim() || null,
        renewedAt: new Date(),
        createdById: user.id,
        updatedById: user.id,
      },
    });

    return { newContract, oldId: source.id, oldNumber: source.number };
  });

  await createAuditLog({
    userId: user.id,
    action: "RENEW",
    entityType: "contract",
    entityId: source.id,
    changes: {
      newContractId: result.newContract.id,
      newContractNumber: result.newContract.number,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "contract",
    entityId: result.newContract.id,
    changes: { renewedFrom: source.id, number: result.newContract.number },
  });

  await createActivity({
    customerId: source.customerId,
    contractId: source.id,
    type: "CONTRACT_RENEWED",
    title: "Sözleşme yenilendi",
    description: `${result.oldNumber} → ${result.newContract.number}`,
    userId: user.id,
    createdById: user.id,
    metadata: {
      newContractId: result.newContract.id,
    } as Prisma.InputJsonValue,
  });

  await createActivity({
    customerId: source.customerId,
    contractId: result.newContract.id,
    type: "CONTRACT_CREATED",
    title: "Yenileme sözleşmesi oluşturuldu",
    description: `Önceki: ${result.oldNumber}`,
    userId: user.id,
    createdById: user.id,
  });

  return result.newContract;
}

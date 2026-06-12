import type { NumberSequenceType } from "@prisma/client";
import { prisma } from "@/lib/db";

const PREFIX: Record<NumberSequenceType, string> = {
  QUOTE: "TEK",
  CONTRACT: "SOZ",
  SERVICE: "SRV",
  VISIT: "VIS",
};

export async function nextDocumentNumber(
  type: NumberSequenceType,
  companyId: string | null
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = PREFIX[type];

  if (!companyId) throw new Error("companyId required for document numbering");

  const seq = await prisma.$transaction(async (tx) => {
    const row = await tx.numberSequence.upsert({
      where: { companyId_type_year: { companyId, type, year } },
      create: { companyId, type, year, prefix, lastValue: 0 },
      update: {},
    });

    const updated = await tx.numberSequence.update({
      where: { id: row.id },
      data: { lastValue: { increment: 1 } },
    });

    return updated;
  });

  const padded = String(seq.lastValue).padStart(4, "0");
  return `${prefix}-${year}-${padded}`;
}

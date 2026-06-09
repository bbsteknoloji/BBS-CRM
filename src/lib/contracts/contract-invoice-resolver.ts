import { prisma } from "@/lib/db";

const NO_INVOICE_TEXT = "Fatura henüz oluşturulmamıştır.";
const INV_PATTERN = /INV-\d{4}-\d+/i;

/**
 * Sözleşmeye bağlı fatura belgesinden numara çözümler.
 * Dosya adı INV-YYYY-NNNNN formatında veya link etiketi "Fatura" içeriyorsa kullanılır.
 */
export async function resolveContractInvoiceNumber(
  contractId: string
): Promise<string> {
  const links = await prisma.documentLink.findMany({
    where: {
      entityType: "CONTRACT",
      entityId: contractId,
      document: { deletedAt: null, status: "ACTIVE" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      label: true,
      document: { select: { originalName: true } },
    },
    take: 20,
  });

  for (const link of links) {
    const name = link.document.originalName;
    const invMatch = name.match(INV_PATTERN);
    if (invMatch) return invMatch[0].toUpperCase();

    if (/fatura|invoice/i.test(link.label ?? "") || /^INV-/i.test(name)) {
      const base = name.replace(/\.[^.]+$/, "");
      if (base.trim()) return base.trim();
    }
  }

  return NO_INVOICE_TEXT;
}

export { NO_INVOICE_TEXT };

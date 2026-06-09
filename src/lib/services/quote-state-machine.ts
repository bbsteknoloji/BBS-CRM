import type { QuoteStatus } from "@prisma/client";

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["SENT"],
  SENT: ["APPROVED", "REJECTED", "REVISION"],
  REVISION: ["SENT"],
  APPROVED: ["CONVERTED"],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
};

export function canTransition(
  from: QuoteStatus,
  to: QuoteStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: QuoteStatus,
  to: QuoteStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Geçersiz durum geçişi: ${from} → ${to}`
    );
  }
}

export function isQuoteEditable(status: QuoteStatus): boolean {
  return status === "DRAFT" || status === "REVISION";
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  REVISION: "Revizyon",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  EXPIRED: "Süresi doldu",
  CONVERTED: "Sözleşmeye dönüştü",
};

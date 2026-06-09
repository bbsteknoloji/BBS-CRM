import type { ServiceTicketStatus } from "@prisma/client";

const TRANSITIONS: Record<ServiceTicketStatus, ServiceTicketStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED"],
  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export function canTransition(
  from: ServiceTicketStatus,
  to: ServiceTicketStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ServiceTicketStatus,
  to: ServiceTicketStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Geçersiz durum geçişi: ${from} → ${to}`);
  }
}

export function isServiceTicketEditable(status: ServiceTicketStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS" || status === "WAITING_CUSTOMER";
}

export const SERVICE_TICKET_STATUS_LABELS: Record<ServiceTicketStatus, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "İşlemde",
  WAITING_CUSTOMER: "Müşteri Bekleniyor",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapatıldı",
};

export const SERVICE_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
};

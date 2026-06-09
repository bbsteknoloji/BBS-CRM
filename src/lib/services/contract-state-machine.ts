import type { ContractStatus } from "@prisma/client";

const TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ["SIGNED"],
  SIGNED: ["ACTIVE"],
  ACTIVE: ["SUSPENDED", "EXPIRED", "TERMINATED", "RENEWED"],
  SUSPENDED: ["ACTIVE"],
  EXPIRED: [],
  TERMINATED: [],
  RENEWED: [],
};

export function canTransition(
  from: ContractStatus,
  to: ContractStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ContractStatus,
  to: ContractStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Geçersiz durum geçişi: ${from} → ${to}`);
  }
}

/** Yalnızca taslak sözleşmeler düzenlenebilir. */
export function isContractEditable(status: ContractStatus): boolean {
  return status === "DRAFT";
}

/** İmzalanmış / kilitli sözleşme (düzenleme kapalı). */
export function isContractLocked(status: ContractStatus): boolean {
  return status !== "DRAFT";
}

export function canSignContract(status: ContractStatus): boolean {
  return status === "DRAFT";
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Taslak",
  SIGNED: "İmzalandı",
  ACTIVE: "Aktif",
  SUSPENDED: "Askıda",
  EXPIRED: "Süresi doldu",
  TERMINATED: "Feshedildi",
  RENEWED: "Yenilendi",
};

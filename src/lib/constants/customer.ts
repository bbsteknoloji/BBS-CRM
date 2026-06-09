import type { CustomerStatus } from "@prisma/client";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  LEAD: "Aday",
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  CHURNED: "Ayrılmış",
};

export const CUSTOMER_STATUS_OPTIONS = (
  Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]
).map((value) => ({
  value,
  label: CUSTOMER_STATUS_LABELS[value],
}));

export const TASK_PRIORITY_LABELS = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
} as const;

export const TASK_STATUS_LABELS = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
} as const;

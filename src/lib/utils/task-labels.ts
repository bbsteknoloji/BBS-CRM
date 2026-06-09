import type { TaskPriority, TaskStatus } from "@prisma/client";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Kritik",
};

export const TASK_STATUS_OPTIONS = (
  Object.keys(TASK_STATUS_LABELS) as TaskStatus[]
).map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}));

export const TASK_PRIORITY_OPTIONS = (
  Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]
).map((value) => ({
  value,
  label: TASK_PRIORITY_LABELS[value],
}));

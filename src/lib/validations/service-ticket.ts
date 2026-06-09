import { z } from "zod";

export const serviceTicketStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const serviceTicketFormSchema = z.object({
  title: z.string().min(2, "Başlık gerekli").max(255),
  customerId: z.string().uuid("Müşteri seçin"),
  contractId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  priority: taskPriorityEnum.default("MEDIUM"),
  assignedUserId: z.string().uuid().optional().or(z.literal("")),
});

export type ServiceTicketFormInput = z.infer<typeof serviceTicketFormSchema>;

export const serviceTicketListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: serviceTicketStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  customerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ServiceTicketListQuery = z.infer<typeof serviceTicketListQuerySchema>;

export const serviceTicketIdSchema = z.object({
  id: z.string().uuid("Geçersiz servis talebi"),
});

export const serviceTicketStatusActionSchema = z.object({
  serviceTicketId: z.string().uuid(),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export const assignServiceTicketSchema = z.object({
  serviceTicketId: z.string().uuid(),
  assignedUserId: z.string().uuid("Personel seçin"),
});

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") obj[k] = v;
  });
  return obj;
}

export function parseFieldErrors(
  error: z.ZodError
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_form";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

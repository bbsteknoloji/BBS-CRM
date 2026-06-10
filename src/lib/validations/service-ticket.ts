import { z } from "zod";

export const serviceTicketStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);

export const serviceTypeEnum = z.enum([
  "FAULT_RESPONSE",
  "MAINTENANCE",
  "INSTALLATION",
  "CONFIGURATION",
  "SYSTEM_UPDATE",
  "ONSITE_SUPPORT",
  "REMOTE_SUPPORT",
]);

export const systemTypeEnum = z.enum([
  "FIREWALL",
  "SWITCH",
  "ACCESS_POINT",
  "CAMERA_SYSTEM",
  "NVR_DVR",
  "SERVER",
  "HOTSPOT_SYSTEM",
  "NETWORK_INFRASTRUCTURE",
  "OTHER",
]);

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const serviceTicketLineItemSchema = z.object({
  description: z.string().min(1, "Açıklama gerekli").max(500),
  quantity: z.coerce.number().positive("Miktar pozitif olmalı"),
  unit: z.string().max(30).default("adet"),
  unitPrice: z.coerce.number().min(0, "Birim fiyat geçersiz"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const serviceTicketFormSchema = z.object({
  title: z.string().min(2, "Başlık gerekli").max(255),
  customerId: z.string().uuid("Müşteri seçin"),
  contractId: z.string().uuid().optional().or(z.literal("")),
  serviceType: serviceTypeEnum.default("FAULT_RESPONSE"),
  priority: taskPriorityEnum.default("MEDIUM"),
  assignedUserId: z.string().uuid().optional().or(z.literal("")),
  systemType: systemTypeEnum.optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  brand: z.string().max(100).optional().or(z.literal("")),
  model: z.string().max(100).optional().or(z.literal("")),
  serialNo: z.string().max(100).optional().or(z.literal("")),
  location: z.string().max(255).optional().or(z.literal("")),
  inventoryNo: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  workDone: z.string().max(5000).optional().or(z.literal("")),
  techNotes: z.string().max(5000).optional().or(z.literal("")),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  lineItems: z.array(serviceTicketLineItemSchema).default([]),
});

export type ServiceTicketFormInput = z.infer<typeof serviceTicketFormSchema>;

export const serviceTicketListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: serviceTicketStatusEnum.optional(),
  serviceType: serviceTypeEnum.optional(),
  priority: taskPriorityEnum.optional(),
  customerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
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

export function parseServiceTicketLineItemsFromFormData(
  formData: FormData
): z.infer<typeof serviceTicketLineItemSchema>[] {
  const raw = formData.get("lineItems");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return z.array(serviceTicketLineItemSchema).parse(parsed);
  } catch {
    return [];
  }
}

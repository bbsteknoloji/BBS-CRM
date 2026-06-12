import { z } from "zod";

export const contractStatusEnum = z.enum([
  "DRAFT",
  "SIGNED",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "TERMINATED",
  "RENEWED",
]);

export const currencyEnum = z.enum(["TRY", "USD", "EUR"]);

export const contractLineItemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1, "Açıklama gerekli").max(500),
  quantity: z.coerce.number().positive("Miktar pozitif olmalı"),
  unit: z.string().max(30).default("adet"),
  unitPrice: z.coerce.number().min(0, "Birim fiyat geçersiz"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const contractFormSchema = z
  .object({
    title: z.string().min(2, "Başlık gerekli").max(255),
    customerId: z.string().uuid("Müşteri seçin"),
    quoteId: z.string().uuid().optional().or(z.literal("")),
    contractDate: z.string().min(1, "Sözleşme tarihi gerekli"),
    startDate: z.string().min(1, "Başlangıç tarihi gerekli"),
    endDate: z.string().optional().or(z.literal("")),
    renewalNoticeDays: z.coerce
      .number()
      .int()
      .min(1, "Yenileme süresi en az 1 gün")
      .max(365)
      .default(30),
    autoRenew: z
      .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true" || v === "1"),
    currency: currencyEnum.default("TRY"),
    notes: z.string().max(5000).optional().or(z.literal("")),
    terms: z.string().max(5000).optional().or(z.literal("")),
    invoiceNumber: z.string().max(100).optional().or(z.literal("")),
    ownerId: z.string().uuid().optional().or(z.literal("")),
    deviceIds: z.array(z.string().uuid()),
    lineItems: z
      .array(contractLineItemSchema)
      .min(1, "En az bir kalem ekleyin"),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    { message: "Bitiş tarihi başlangıçtan önce olamaz", path: ["endDate"] }
  );

export type ContractFormInput = z.infer<typeof contractFormSchema>;

export const contractListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: contractStatusEnum.optional(),
  customerId: z.string().uuid().optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ContractListQuery = z.infer<typeof contractListQuerySchema>;

export const contractIdSchema = z.object({
  id: z.string().uuid("Geçersiz sözleşme"),
});

export const contractStatusActionSchema = z.object({
  contractId: z.string().uuid(),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export const contractRenewSchema = z.object({
  contractId: z.string().uuid(),
  newStartDate: z.string().min(1, "Yeni başlangıç tarihi gerekli"),
  newEndDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const ALLOWED_CONTRACT_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

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

export function parseLineItemsFromFormData(
  formData: FormData
): z.infer<typeof contractLineItemSchema>[] {
  const raw = formData.get("lineItems");
  if (typeof raw !== "string") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const result = z.array(contractLineItemSchema).safeParse(parsed);
  if (!result.success) throw result.error;
  return result.data;
}

export function parseDeviceIdsFromFormData(formData: FormData): string[] {
  const raw = formData.get("deviceIds");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return z.array(z.string().uuid()).parse(parsed);
  } catch {
    return [];
  }
}

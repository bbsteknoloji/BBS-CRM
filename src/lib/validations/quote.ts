import { z } from "zod";

export const quoteStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "REVISION",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export const currencyEnum = z.enum(["TRY", "USD", "EUR"]);

export const quoteLineItemSchema = z.object({
  productId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  productCode: z
    .string()
    .trim()
    .max(64, "Ürün kodu en fazla 64 karakter")
    .optional()
    .or(z.literal(""))
    .transform((v) => v?.trim() || undefined),
  description: z.string().trim().min(1, "Açıklama gerekli").max(500),
  quantity: z.coerce
    .number({ invalid_type_error: "Miktar geçersiz" })
    .gt(0, "Miktar 0'dan büyük olmalı"),
  unit: z.string().max(30).default("adet"),
  unitPrice: z.coerce.number().min(0, "Birim fiyat geçersiz"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const quoteTemplateEnum = z.enum(["STANDARD", "REFERENCED"]);

export const quoteFormSchema = z.object({
  title: z.string().min(2, "Başlık gerekli").max(255),
  customerId: z.string().uuid("Müşteri seçin"),
  currency: currencyEnum.default("TRY"),
  quoteTemplate: quoteTemplateEnum.default("STANDARD"),
  validUntil: z.string().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  terms: z.string().max(5000).optional().or(z.literal("")),
  lineItems: z
    .array(quoteLineItemSchema)
    .min(1, "En az bir kalem ekleyin"),
});

export type QuoteFormInput = z.infer<typeof quoteFormSchema>;

export const quoteListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: quoteStatusEnum.optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;

export const quoteIdSchema = z.object({
  id: z.string().uuid("Geçersiz teklif"),
});

export const quoteStatusActionSchema = z.object({
  quoteId: z.string().uuid(),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export const convertQuoteSchema = z.object({
  quoteId: z.string().uuid(),
  startDate: z.string().min(1, "Başlangıç tarihi gerekli"),
  endDate: z.string().optional().or(z.literal("")),
  ownerId: z.string().uuid().optional(),
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
    let path = issue.path.join(".") || "_form";
    const lineMatch = path.match(/^lineItems\.(\d+)\.(\w+)$/);
    if (lineMatch) {
      const index = Number(lineMatch[1]) + 1;
      const field = lineMatch[2];
      const labels: Record<string, string> = {
        description: "Açıklama",
        quantity: "Miktar",
        unitPrice: "Birim fiyat",
        taxRate: "KDV",
        productId: "Ürün",
        productCode: "Ürün kodu",
      };
      path = `Kalem ${index} — ${labels[field] ?? field}`;
    }
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

export function parseLineItemsFromFormData(
  formData: FormData
): z.infer<typeof quoteLineItemSchema>[] | null {
  const raw = formData.get("lineItems");
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = z
    .array(quoteLineItemSchema)
    .min(1, "En az bir kalem ekleyin")
    .safeParse(parsed);

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

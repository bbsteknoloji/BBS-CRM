import { z } from "zod";
import { currencyEnum } from "@/lib/validations/quote";

export const productTypeEnum = z.enum(["SERVICE", "PRODUCT"]);

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "Ürün kodu gerekli")
    .max(50, "Ürün kodu en fazla 50 karakter"),
  name: z
    .string()
    .trim()
    .min(2, "Ürün adı en az 2 karakter")
    .max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Birim gerekli").max(30).default("adet"),
  unitPrice: z.coerce.number().min(0, "Satış fiyatı geçersiz"),
  taxRate: z.coerce
    .number()
    .min(0, "KDV oranı geçersiz")
    .max(100, "KDV en fazla %100"),
  currency: currencyEnum.default("TRY"),
  type: productTypeEnum.default("SERVICE"),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((v) => v === true || v === "true"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const productListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const productIdSchema = z.object({
  id: z.string().uuid("Geçersiz ürün"),
});

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") obj[key] = value;
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

export function parseProductFormData(formData: FormData) {
  const raw = formDataToObject(formData);
  return productFormSchema.safeParse({
    ...raw,
    isActive: raw.isActive ?? "true",
  });
}

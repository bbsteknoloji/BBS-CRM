import { z } from "zod";
import type { CrmImportFieldKey } from "@/lib/imports/logo-customer-fields";

export const columnMappingSchema = z.object({
  customerCode: z.string().min(1, "Cari kodu kolonu seçin"),
  companyName: z.string().min(1, "Ünvan kolonu seçin"),
  taxNumber: z.string().min(1, "Vergi no kolonu seçin"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

export type ColumnMappingInput = z.infer<typeof columnMappingSchema>;

export const importRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  customerCode: z.string().trim().min(1, "Cari kodu boş"),
  companyName: z
    .string()
    .trim()
    .min(2, "Ünvan en az 2 karakter")
    .max(255),
  taxNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 11, "Vergi no 10-11 hane olmalı"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      const s = (v ?? "").trim();
      if (!s) return undefined;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : undefined;
    }),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  contactPerson: z.string().trim().max(200).optional().or(z.literal("")),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

export const importCustomersPayloadSchema = z.object({
  mapping: columnMappingSchema,
  rows: z.array(z.record(z.string())).min(1, "İçe aktarılacak satır yok"),
});

export function mapRowWithMapping(
  row: Record<string, string>,
  rowNumber: number,
  mapping: ColumnMappingInput
): { success: true; data: ImportRowInput } | { success: false; error: string } {
  const pick = (key: CrmImportFieldKey) => {
    const col = mapping[key];
    if (!col) return "";
    return (row[col] ?? "").trim();
  };

  const parsed = importRowSchema.safeParse({
    rowNumber,
    customerCode: pick("customerCode"),
    companyName: pick("companyName"),
    taxNumber: pick("taxNumber"),
    phone: pick("phone") || undefined,
    email: pick("email") || undefined,
    address: pick("address") || undefined,
    contactPerson: pick("contactPerson") || undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: msg };
  }

  return { success: true, data: parsed.data };
}

import { z } from "zod";

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s]*)?$/i;

function isValidWebsiteInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  return DOMAIN_PATTERN.test(trimmed);
}

export function normalizeWebsite(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const customerStatusEnum = z.enum([  "LEAD",
  "ACTIVE",
  "INACTIVE",
  "CHURNED",
]);

export const customerFormSchema = z.object({
  legalName: z
    .string()
    .min(2, "Firma adı en az 2 karakter olmalı")
    .max(255),
  tradeName: z.string().max(255).optional().or(z.literal("")),
  taxNumber: z
    .string()
    .min(10, "Vergi numarası geçersiz")
    .max(11, "Vergi numarası en fazla 11 hane")
    .regex(/^\d+$/, "Vergi numarası yalnızca rakam içermeli"),
  taxOffice: z.string().max(100).optional().or(z.literal("")),
  website: z
    .string()
    .max(255)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => isValidWebsiteInput(v ?? ""),
      "Geçerli bir web sitesi adresi girin"
    )
    .transform((v) => normalizeWebsite(v)),
  status: customerStatusEnum,
  assignedToId: z.string().uuid("Geçerli sorumlu seçin").optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  authorizedPerson: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .email("Geçerli e-posta girin")
    .optional()
    .or(z.literal("")),
  addressLine: z.string().min(3, "Adres en az 3 karakter").max(255),
  city: z.string().min(2, "Şehir gerekli").max(100),
  district: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;

export const customerListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: customerStatusEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

export const customerIdSchema = z.object({
  id: z.string().uuid("Geçersiz müşteri"),
});

export const contactFormSchema = z.object({
  customerId: z.string().uuid(),
  fullName: z.string().min(2, "Ad soyad gerekli").max(200),
  title: z.string().max(100).optional().or(z.literal("")),
  email: z
    .string()
    .email("Geçerli e-posta")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const contactIdSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
});

export const customerTaskFormSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(2, "Başlık gerekli").max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  assignedToId: z.string().uuid(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.string().optional().or(z.literal("")),
});

export type CustomerTaskFormInput = z.infer<typeof customerTaskFormSchema>;

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

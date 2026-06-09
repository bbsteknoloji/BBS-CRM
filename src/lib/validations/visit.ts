import { z } from "zod";

export const visitFormSchema = z
  .object({
    customerId: z.string().uuid("Müşteri seçin"),
    contractId: z.string().uuid().optional().or(z.literal("")),
    serviceTicketId: z.string().uuid().optional().or(z.literal("")),
    userId: z.string().uuid("Personel seçin"),
    visitDate: z.string().min(1, "Ziyaret tarihi gerekli"),
    description: z.string().min(1, "Açıklama gerekli").max(10000),
    result: z.string().max(5000).optional().or(z.literal("")),
    nextVisitDate: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.nextVisitDate) return true;
      return new Date(data.nextVisitDate) >= new Date(data.visitDate);
    },
    {
      message: "Sonraki ziyaret, ziyaret tarihinden önce olamaz",
      path: ["nextVisitDate"],
    }
  );

export type VisitFormInput = z.infer<typeof visitFormSchema>;

export const visitListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  customerId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  serviceTicketId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  upcoming: z
    .union([z.literal("1"), z.literal("true"), z.literal("on")])
    .optional()
    .transform((v) => v === "1" || v === "true" || v === "on"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type VisitListQuery = z.infer<typeof visitListQuerySchema>;

export const visitIdSchema = z.object({
  id: z.string().uuid("Geçersiz ziyaret"),
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

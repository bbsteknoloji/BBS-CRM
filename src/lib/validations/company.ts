import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().min(2, "Firma adı en az 2 karakter olmalı").max(255),
  email: z.string().email("Geçerli e-posta giriniz").max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(1000).optional().or(z.literal("")),
});

export type CompanyFormInput = z.infer<typeof companyFormSchema>;

export function parseFieldErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = [];
    result[key].push(issue.message);
  }
  return result;
}

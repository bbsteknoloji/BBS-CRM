import { z } from "zod";

export const customerDeviceFormSchema = z.object({
  customerId: z.string().uuid(),
  deviceName: z.string().min(2, "Cihaz adı gerekli").max(255),
  brand: z.string().max(100).optional().or(z.literal("")),
  model: z.string().max(100).optional().or(z.literal("")),
  serialNumber: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export type CustomerDeviceFormInput = z.infer<typeof customerDeviceFormSchema>;

export const customerDeviceIdSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
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

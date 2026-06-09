import { z } from "zod";

export const taskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Başlık en az 2 karakter")
      .max(255),
    description: z.string().max(10000).optional().or(z.literal("")),
    priority: taskPriorityEnum.default("MEDIUM"),
    status: taskStatusEnum.default("TODO"),
    startAt: z.string().optional().or(z.literal("")),
    dueAt: z.string().optional().or(z.literal("")),
    assignedToId: z.string().uuid("Atanan kullanıcı seçin"),
    customerId: z.string().uuid().optional().or(z.literal("")),
    quoteId: z.string().uuid().optional().or(z.literal("")),
    contractId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startAt || !data.dueAt) return true;
      return new Date(data.startAt) <= new Date(data.dueAt);
    },
    {
      message: "Bitiş tarihi başlangıçtan önce olamaz",
      path: ["dueAt"],
    }
  );

export type TaskFormInput = z.infer<typeof taskFormSchema>;

export const taskListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const taskIdSchema = z.object({
  id: z.string().uuid("Geçersiz görev"),
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

export function parseTaskFormData(formData: FormData) {
  const raw = formDataToObject(formData);
  return taskFormSchema.safeParse(raw);
}

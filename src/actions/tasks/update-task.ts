"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  parseFieldErrors,
  parseTaskFormData,
  taskIdSchema,
} from "@/lib/validations/task";
import { updateTask } from "@/lib/services/task-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateTaskAction(
  taskId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("task:update");

  const idParsed = taskIdSchema.safeParse({ id: taskId });
  if (!idParsed.success) {
    return actionError("Geçersiz görev");
  }

  const parsed = parseTaskFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  const id = await updateTask(user, taskId, parsed.data);
  if (!id) {
    return actionError("Görev güncellenemedi veya bulunamadı.");
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath("/dashboard");
  return actionSuccess({ id });
}

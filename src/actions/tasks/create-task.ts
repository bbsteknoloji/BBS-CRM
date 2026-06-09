"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  parseFieldErrors,
  parseTaskFormData,
} from "@/lib/validations/task";
import { createTask } from "@/lib/services/task-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createTaskAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("task:create");

  const parsed = parseTaskFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    const id = await createTask(user, parsed.data);
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return actionSuccess({ id });
  } catch {
    return actionError("Görev oluşturulamadı.");
  }
}

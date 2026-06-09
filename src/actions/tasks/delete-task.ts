"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { taskIdSchema } from "@/lib/validations/task";
import { deleteTask } from "@/lib/services/task-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResult> {
  const user = await requirePermission("task:delete");

  const parsed = taskIdSchema.safeParse({ id: taskId });
  if (!parsed.success) {
    return actionError("Geçersiz görev");
  }

  const ok = await deleteTask(user, taskId);
  if (!ok) {
    return actionError("Görev silinemedi veya bulunamadı.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return actionSuccess(undefined);
}

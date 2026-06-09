"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  customerTaskFormSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/customer";
import { createCustomerTask } from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createCustomerTaskAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("customer:write");

  const raw = formDataToObject(formData);
  const parsed = customerTaskFormSchema.safeParse({
    ...raw,
    dueAt: raw.dueAt || undefined,
  });

  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  const id = await createCustomerTask(user, parsed.data);
  if (!id) {
    return actionError("Görev oluşturulamadı.");
  }

  revalidatePath(`/customers/${parsed.data.customerId}`);
  revalidatePath("/tasks");
  return actionSuccess({ id });
}

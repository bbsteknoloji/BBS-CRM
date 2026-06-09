"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import {
  customerFormSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/customer";
import { createCustomer } from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createCustomerAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("customer:write");

  const raw = formDataToObject(formData);
  const parsed = customerFormSchema.safeParse({
    ...raw,
    website: raw.website || undefined,
    assignedToId: raw.assignedToId || undefined,
  });

  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    const id = await createCustomer(user, parsed.data);
    revalidatePath("/customers");
    return actionSuccess({ id });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "Bu vergi numarası zaten kayıtlı."
        : "Müşteri oluşturulamadı.";
    return actionError(message);
  }
}

export async function createCustomerAndRedirect(formData: FormData) {
  const result = await createCustomerAction(formData);
  if (result.success) {
    redirect(`/customers/${result.data.id}`);
  }
  return result;
}

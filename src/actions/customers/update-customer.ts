"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  customerFormSchema,
  customerIdSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/customer";
import { updateCustomer } from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateCustomerAction(
  customerId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("customer:write");

  const idParsed = customerIdSchema.safeParse({ id: customerId });
  if (!idParsed.success) {
    return actionError("Geçersiz müşteri");
  }

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
    const id = await updateCustomer(user, customerId, parsed.data);
    if (!id) {
      return actionError("Müşteri bulunamadı veya erişim yok.");
    }
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    return actionSuccess({ id });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "Bu vergi numarası zaten kayıtlı."
        : "Müşteri güncellenemedi.";
    return actionError(message);
  }
}

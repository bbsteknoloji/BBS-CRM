"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  contactFormSchema,
  contactIdSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/customer";
import {
  createCustomerContact,
  deleteCustomerContact,
} from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createContactAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("customer:write");

  const raw = formDataToObject(formData);
  const parsed = contactFormSchema.safeParse({
    ...raw,
    isPrimary: raw.isPrimary === "true" || raw.isPrimary === "on",
  });

  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  const id = await createCustomerContact(user, parsed.data);
  if (!id) {
    return actionError("İletişim kişisi eklenemedi.");
  }

  revalidatePath(`/customers/${parsed.data.customerId}`);
  return actionSuccess({ id });
}

export async function deleteContactAction(
  customerId: string,
  contactId: string
): Promise<ActionResult> {
  const user = await requirePermission("customer:write");

  const parsed = contactIdSchema.safeParse({ id: contactId, customerId });
  if (!parsed.success) {
    return actionError("Geçersiz kayıt");
  }

  const ok = await deleteCustomerContact(user, customerId, contactId);
  if (!ok) {
    return actionError("Kişi silinemedi.");
  }

  revalidatePath(`/customers/${customerId}`);
  return actionSuccess(undefined);
}

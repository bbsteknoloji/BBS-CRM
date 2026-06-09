"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  customerDeviceFormSchema,
  customerDeviceIdSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/customer-device";
import {
  createCustomerDevice,
  updateCustomerDevice,
  deleteCustomerDevice,
} from "@/lib/services/customer-device-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createCustomerDeviceAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("customer:write");

  const raw = formDataToObject(formData);
  const parsed = customerDeviceFormSchema.safeParse(raw);

  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  const id = await createCustomerDevice(user, parsed.data);
  if (!id) {
    return actionError("Cihaz eklenemedi.");
  }

  revalidatePath(`/customers/${parsed.data.customerId}`);
  return actionSuccess({ id });
}

export async function updateCustomerDeviceAction(
  customerId: string,
  deviceId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("customer:write");

  const idParsed = customerDeviceIdSchema.safeParse({ id: deviceId, customerId });
  if (!idParsed.success) {
    return actionError("Geçersiz kayıt");
  }

  const raw = formDataToObject(formData);
  const parsed = customerDeviceFormSchema.safeParse({ ...raw, customerId });
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  const ok = await updateCustomerDevice(user, customerId, deviceId, parsed.data);
  if (!ok) {
    return actionError("Cihaz güncellenemedi.");
  }

  revalidatePath(`/customers/${customerId}`);
  return actionSuccess(undefined);
}

export async function deleteCustomerDeviceAction(
  customerId: string,
  deviceId: string
): Promise<ActionResult> {
  const user = await requirePermission("customer:write");

  const parsed = customerDeviceIdSchema.safeParse({ id: deviceId, customerId });
  if (!parsed.success) {
    return actionError("Geçersiz kayıt");
  }

  const ok = await deleteCustomerDevice(user, customerId, deviceId);
  if (!ok) {
    return actionError("Cihaz silinemedi.");
  }

  revalidatePath(`/customers/${customerId}`);
  return actionSuccess(undefined);
}

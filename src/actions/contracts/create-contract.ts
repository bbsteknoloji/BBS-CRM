"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  contractFormSchema,
  formDataToObject,
  parseLineItemsFromFormData,
  parseDeviceIdsFromFormData,
  parseFieldErrors,
} from "@/lib/validations/contract";
import { createContract } from "@/lib/services/contract-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

function parseFormData(formData: FormData) {
  const raw = formDataToObject(formData);
  const lineItems = parseLineItemsFromFormData(formData);
  const deviceIds = parseDeviceIdsFromFormData(formData);
  return contractFormSchema.safeParse({
    ...raw,
    quoteId: raw.quoteId || undefined,
    endDate: raw.endDate || undefined,
    ownerId: raw.ownerId || undefined,
    lineItems,
    deviceIds,
  });
}

export async function createContractAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("contract:write");
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }
  try {
    const id = await createContract(user, parsed.data);
    revalidatePath("/contracts");
    revalidatePath("/dashboard");
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Sözleşme oluşturulamadı"
    );
  }
}

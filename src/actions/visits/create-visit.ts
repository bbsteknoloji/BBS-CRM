"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  visitFormSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/visit";
import { createVisit } from "@/lib/services/visit-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createVisitAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("visit:write");
  const raw = formDataToObject(formData);
  const parsed = visitFormSchema.safeParse({
    ...raw,
    contractId: raw.contractId || undefined,
    serviceTicketId: raw.serviceTicketId || undefined,
    result: raw.result || undefined,
    nextVisitDate: raw.nextVisitDate || undefined,
  });
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }
  try {
    const id = await createVisit(user, parsed.data);
    revalidatePath("/visits");
    revalidatePath("/dashboard");
    revalidatePath(`/customers/${parsed.data.customerId}`);
    if (parsed.data.serviceTicketId) {
      revalidatePath(`/service-tickets/${parsed.data.serviceTicketId}`);
    }
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Saha ziyareti oluşturulamadı"
    );
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  visitFormSchema,
  visitIdSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/visit";
import { updateVisit } from "@/lib/services/visit-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateVisitAction(
  visitId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("visit:write");
  if (!visitIdSchema.safeParse({ id: visitId }).success) {
    return actionError("Geçersiz ziyaret");
  }
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
    const id = await updateVisit(user, visitId, parsed.data);
    if (!id) return actionError("Ziyaret bulunamadı veya erişim yok");
    revalidatePath("/visits");
    revalidatePath(`/visits/${id}`);
    revalidatePath("/dashboard");
    revalidatePath(`/customers/${parsed.data.customerId}`);
    if (parsed.data.serviceTicketId) {
      revalidatePath(`/service-tickets/${parsed.data.serviceTicketId}`);
    }
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Saha ziyareti güncellenemedi"
    );
  }
}

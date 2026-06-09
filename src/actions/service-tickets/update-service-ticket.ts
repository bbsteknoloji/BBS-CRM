"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  serviceTicketFormSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/service-ticket";
import { updateServiceTicket } from "@/lib/services/service-ticket-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateServiceTicketAction(
  serviceTicketId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("service:write");
  const raw = formDataToObject(formData);
  const parsed = serviceTicketFormSchema.safeParse({
    ...raw,
    contractId: raw.contractId || undefined,
    assignedUserId: raw.assignedUserId || undefined,
  });
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }
  try {
    const id = await updateServiceTicket(user, serviceTicketId, parsed.data);
    if (!id) return actionError("Servis talebi bulunamadı");
    revalidatePath("/service-tickets");
    revalidatePath(`/service-tickets/${serviceTicketId}`);
    revalidatePath("/dashboard");
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Servis talebi güncellenemedi"
    );
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  serviceTicketFormSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/service-ticket";
import { createServiceTicket } from "@/lib/services/service-ticket-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createServiceTicketAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("service:write");
  const raw = formDataToObject(formData);
  const { parseServiceTicketLineItemsFromFormData } = await import("@/lib/validations/service-ticket");
  const lineItems = parseServiceTicketLineItemsFromFormData(formData);
  const parsed = serviceTicketFormSchema.safeParse({
    ...raw,
    contractId: raw.contractId || undefined,
    assignedUserId: raw.assignedUserId || undefined,
    systemType: raw.systemType || undefined,
    lineItems,
  });
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }
  try {
    const id = await createServiceTicket(user, parsed.data);
    revalidatePath("/service-tickets");
    revalidatePath("/dashboard");
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Servis talebi oluşturulamadı"
    );
  }
}

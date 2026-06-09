"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { deleteServiceTicket } from "@/lib/services/service-ticket-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteServiceTicketAction(
  serviceTicketId: string
): Promise<ActionResult> {
  const user = await requirePermission("service:delete");
  try {
    const ticketNo = await deleteServiceTicket(user, serviceTicketId);
    if (!ticketNo) return actionError("Servis talebi bulunamadı");
    revalidatePath("/service-tickets");
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Servis talebi silinemedi"
    );
  }
}

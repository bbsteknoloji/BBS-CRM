"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  serviceTicketStatusActionSchema,
  assignServiceTicketSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/service-ticket";
import {
  startServiceTicket,
  waitCustomerServiceTicket,
  resumeServiceTicket,
  resolveServiceTicket,
  closeServiceTicket,
  assignServiceTicket,
} from "@/lib/services/service-ticket-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { generateServiceTicketPdf } from "@/lib/services/service-ticket-pdf-service";

function revalidateTicket(id: string) {
  revalidatePath("/service-tickets");
  revalidatePath(`/service-tickets/${id}`);
  revalidatePath("/dashboard");
}

export async function startServiceTicketAction(
  id: string
): Promise<ActionResult> {
  const user = await requirePermission("service:write");
  try {
    const t = await startServiceTicket(user, id);
    if (!t) return actionError("Servis talebi bulunamadı");
    revalidateTicket(id);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function waitCustomerServiceTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("service:write");
  const raw = formDataToObject(formData);
  const parsed = serviceTicketStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const t = await waitCustomerServiceTicket(
      user,
      parsed.data.serviceTicketId,
      parsed.data.reason
    );
    if (!t) return actionError("Servis talebi bulunamadı");
    revalidateTicket(parsed.data.serviceTicketId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function resumeServiceTicketAction(
  id: string
): Promise<ActionResult> {
  const user = await requirePermission("service:write");
  try {
    const t = await resumeServiceTicket(user, id);
    if (!t) return actionError("Geçersiz durum geçişi");
    revalidateTicket(id);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function resolveServiceTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("service:write");
  const raw = formDataToObject(formData);
  const parsed = serviceTicketStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const t = await resolveServiceTicket(
      user,
      parsed.data.serviceTicketId,
      parsed.data.reason
    );
    if (!t) return actionError("Servis talebi bulunamadı");
    revalidateTicket(parsed.data.serviceTicketId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function closeServiceTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("service:close");
  const raw = formDataToObject(formData);
  const parsed = serviceTicketStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const t = await closeServiceTicket(
      user,
      parsed.data.serviceTicketId,
      parsed.data.reason
    );
    if (!t) return actionError("Servis talebi bulunamadı");
    revalidateTicket(parsed.data.serviceTicketId);
    // PDF'i arka planda üret — kullanıcıyı beklettirme
    generateServiceTicketPdf(parsed.data.serviceTicketId, user.id, false).catch(
      (err) => console.error("[ServiceTicket PDF] auto-gen failed:", err)
    );
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function assignServiceTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("service:assign");
  const raw = formDataToObject(formData);
  const parsed = assignServiceTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const t = await assignServiceTicket(
      user,
      parsed.data.serviceTicketId,
      parsed.data.assignedUserId
    );
    if (!t) return actionError("Servis talebi bulunamadı");
    revalidateTicket(parsed.data.serviceTicketId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Atama başarısız");
  }
}

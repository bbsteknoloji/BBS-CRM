"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { serviceTicketIdSchema } from "@/lib/validations/service-ticket";
import {
  buildEntityFilesPath,
  DEFAULT_ATTACHMENT_MIME,
  uploadEntityDocument,
} from "@/lib/services/document-upload-service";
import { getServiceTicketDetail } from "@/lib/services/service-ticket-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function uploadServiceTicketDocumentAction(
  ticketId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const user = await requirePermission("document:upload");
  if (!serviceTicketIdSchema.safeParse({ id: ticketId }).success) {
    return actionError("Geçersiz servis talebi");
  }

  const ticket = await getServiceTicketDetail(user, ticketId);
  if (!ticket) return actionError("Talep bulunamadı");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Dosya seçin");
  }
  if (file.size > 20 * 1024 * 1024) {
    return actionError("Dosya boyutu en fazla 20 MB olabilir");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const documentId = await uploadEntityDocument({
      entityType: "SERVICE_TICKET",
      entityId: ticketId,
      customerId: ticket.customer.id,
      uploadedById: user.id,
      file: { name: file.name, type: file.type, buffer },
      storageSubPath: buildEntityFilesPath("SERVICE_TICKET", ticketId),
      allowedMime: DEFAULT_ATTACHMENT_MIME,
      activityTitle: "Servis talebine dosya yüklendi",
    });
    revalidatePath(`/service-tickets/${ticketId}`);
    revalidatePath("/files");
    return actionSuccess({ documentId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Yükleme başarısız");
  }
}

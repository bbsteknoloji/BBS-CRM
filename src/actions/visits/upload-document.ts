"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { visitIdSchema } from "@/lib/validations/visit";
import {
  buildEntityFilesPath,
  DEFAULT_ATTACHMENT_MIME,
  uploadEntityDocument,
} from "@/lib/services/document-upload-service";
import { getVisitDetail } from "@/lib/services/visit-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function uploadVisitDocumentAction(
  visitId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const user = await requirePermission("document:upload");
  if (!visitIdSchema.safeParse({ id: visitId }).success) {
    return actionError("Geçersiz ziyaret");
  }

  const visit = await getVisitDetail(user, visitId);
  if (!visit) return actionError("Ziyaret bulunamadı");

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
      entityType: "VISIT",
      entityId: visitId,
      customerId: visit.customer.id,
      uploadedById: user.id,
      file: { name: file.name, type: file.type, buffer },
      storageSubPath: buildEntityFilesPath("VISIT", visitId),
      allowedMime: DEFAULT_ATTACHMENT_MIME,
      activityTitle: "Saha ziyaretine dosya yüklendi",
    });
    revalidatePath(`/visits/${visitId}`);
    revalidatePath("/files");
    return actionSuccess({ documentId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Yükleme başarısız");
  }
}

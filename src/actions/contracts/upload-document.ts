"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { contractIdSchema } from "@/lib/validations/contract";
import { uploadContractDocument } from "@/lib/services/contract-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function uploadContractDocumentAction(
  contractId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const user = await requirePermission("contract:write");
  const parsed = contractIdSchema.safeParse({ id: contractId });
  if (!parsed.success) return actionError("Geçersiz sözleşme");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Dosya seçin");
  }
  if (file.size > 20 * 1024 * 1024) {
    return actionError("Dosya boyutu en fazla 20 MB olabilir");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const documentId = await uploadContractDocument(user, contractId, {
      name: file.name,
      type: file.type,
      buffer,
    });
    if (!documentId) return actionError("Sözleşme bulunamadı");
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath("/files");
    return actionSuccess({ documentId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Yükleme başarısız");
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { softDeleteDocument } from "@/lib/services/file-center-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteFileAction(
  documentId: string
): Promise<ActionResult<{ ok: true }>> {
  const user = await requirePermission("file:delete");
  const ok = await softDeleteDocument(user, documentId);
  if (!ok) {
    return actionError("Dosya silinemedi veya yetki yok");
  }
  revalidatePath("/files");
  revalidatePath("/dashboard");
  return actionSuccess({ ok: true });
}

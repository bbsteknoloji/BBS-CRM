"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { deleteContract } from "@/lib/services/contract-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteContractAction(
  contractId: string
): Promise<ActionResult> {
  const user = await requirePermission("contract:delete");
  try {
    const number = await deleteContract(user, contractId);
    if (!number) return actionError("Sözleşme bulunamadı");
    revalidatePath("/contracts");
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Sözleşme silinemedi");
  }
}

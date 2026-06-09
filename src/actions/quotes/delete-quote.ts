"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { deleteQuote } from "@/lib/services/quote-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  const user = await requirePermission("quote:delete");
  try {
    const number = await deleteQuote(user, quoteId);
    if (!number) return actionError("Teklif bulunamadı");
    revalidatePath("/quotes");
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Teklif silinemedi");
  }
}

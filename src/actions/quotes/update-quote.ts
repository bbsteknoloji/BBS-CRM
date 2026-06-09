"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { z } from "zod";
import {
  quoteFormSchema,
  quoteLineItemSchema,
  quoteIdSchema,
  formDataToObject,
  parseLineItemsFromFormData,
  parseFieldErrors,
} from "@/lib/validations/quote";
import { updateQuote } from "@/lib/services/quote-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateQuoteAction(
  quoteId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("quote:write");
  const idCheck = quoteIdSchema.safeParse({ id: quoteId });
  if (!idCheck.success) return actionError("Geçersiz teklif");

  const raw = formDataToObject(formData);
  let lineItems: z.infer<typeof quoteLineItemSchema>[];
  try {
    const parsed = parseLineItemsFromFormData(formData);
    if (!parsed) {
      const fail = quoteFormSchema.safeParse({
        ...raw,
        validUntil: raw.validUntil || undefined,
        lineItems: [],
      });
      if (!fail.success) {
        return actionError("Form doğrulama hatası", parseFieldErrors(fail.error));
      }
      return actionError("Kalem bilgisi okunamadı");
    }
    lineItems = parsed;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return actionError("Form doğrulama hatası", parseFieldErrors(e));
    }
    throw e;
  }

  const parsed = quoteFormSchema.safeParse({
    ...raw,
    validUntil: raw.validUntil || undefined,
    lineItems,
  });
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    const id = await updateQuote(user, quoteId, parsed.data);
    if (!id) return actionError("Teklif bulunamadı");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Teklif güncellenemedi"
    );
  }
}

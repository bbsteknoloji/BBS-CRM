"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { z } from "zod";
import {
  quoteFormSchema,
  quoteLineItemSchema,
  formDataToObject,
  parseLineItemsFromFormData,
  parseFieldErrors,
} from "@/lib/validations/quote";
import { createQuote } from "@/lib/services/quote-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

function parseFormData(formData: FormData) {
  const raw = formDataToObject(formData);
  let lineItems: z.infer<typeof quoteLineItemSchema>[];
  try {
    const parsed = parseLineItemsFromFormData(formData);
    if (!parsed) {
      return quoteFormSchema.safeParse({
        ...raw,
        validUntil: raw.validUntil || undefined,
        lineItems: [],
      });
    }
    lineItems = parsed;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false as const, error: e };
    }
    throw e;
  }

  return quoteFormSchema.safeParse({
    ...raw,
    validUntil: raw.validUntil || undefined,
    lineItems,
  });
}

export async function createQuoteAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("quote:write");
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }
  try {
    const id = await createQuote(user, parsed.data);
    revalidatePath("/quotes");
    return actionSuccess({ id });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Teklif oluşturulamadı"
    );
  }
}

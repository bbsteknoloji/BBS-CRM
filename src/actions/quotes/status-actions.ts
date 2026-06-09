"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  quoteIdSchema,
  quoteStatusActionSchema,
  convertQuoteSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/quote";
import {
  sendQuote,
  approveQuote,
  rejectQuote,
  startQuoteRevision,
  resendQuote,
  convertQuoteToContract,
} from "@/lib/services/quote-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

function revalidateQuote(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function sendQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  const user = await requirePermission("quote:write");
  const parsed = quoteIdSchema.safeParse({ id: quoteId });
  if (!parsed.success) return actionError("Geçersiz teklif");
  try {
    const q = await sendQuote(user, quoteId);
    if (!q) return actionError("Teklif bulunamadı");
    revalidateQuote(quoteId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function approveQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  const user = await requirePermission("quote:approve");
  try {
    const q = await approveQuote(user, quoteId);
    if (!q) return actionError("Teklif bulunamadı");
    revalidateQuote(quoteId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function rejectQuoteAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("quote:approve");
  const raw = formDataToObject(formData);
  const parsed = quoteStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const q = await rejectQuote(
      user,
      parsed.data.quoteId,
      parsed.data.reason
    );
    if (!q) return actionError("Teklif bulunamadı");
    revalidateQuote(parsed.data.quoteId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function revisionQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  const user = await requirePermission("quote:write");
  try {
    const q = await startQuoteRevision(user, quoteId);
    if (!q) return actionError("Teklif bulunamadı");
    revalidateQuote(quoteId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function resendQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  const user = await requirePermission("quote:write");
  try {
    const q = await resendQuote(user, quoteId);
    if (!q) return actionError("Teklif bulunamadı");
    revalidateQuote(quoteId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function convertQuoteAction(
  formData: FormData
): Promise<ActionResult<{ contractId: string; contractNumber: string }>> {
  const user = await requirePermission("quote:approve");
  const raw = formDataToObject(formData);
  const parsed = convertQuoteSchema.safeParse({
    ...raw,
    endDate: raw.endDate || undefined,
    ownerId: raw.ownerId || undefined,
  });
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const contract = await convertQuoteToContract(
      user,
      parsed.data.quoteId,
      {
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        ownerId: parsed.data.ownerId,
      }
    );
    if (!contract) return actionError("Teklif bulunamadı");
    revalidateQuote(parsed.data.quoteId);
    revalidatePath("/contracts");
    return actionSuccess({
      contractId: contract.id,
      contractNumber: contract.number,
    });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Dönüşüm başarısız");
  }
}

export async function generateQuotePdfAction(
  quoteId: string
): Promise<ActionResult<{ pdfVersionId: string }>> {
  const { requireAuth } = await import("@/lib/permissions/server");
  const { hasAnyPermission } = await import("@/lib/permissions/check");
  const user = await requireAuth();
  if (!hasAnyPermission(user, ["quote:write", "quote:approve"])) {
    return actionError("PDF oluşturma yetkisi yok");
  }
  const { generateQuotePdf } = await import(
    "@/lib/services/quote-pdf-service"
  );
  try {
    const result = await generateQuotePdf(quoteId, user.id);
    if (!result) return actionError("PDF oluşturulamadı");
    revalidateQuote(quoteId);
    return actionSuccess({ pdfVersionId: result.pdfVersionId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "PDF hatası");
  }
}

export async function signQuoteAction(
  quoteId: string
): Promise<ActionResult<{ pdfVersionId: string }>> {
  const { requireAuth } = await import("@/lib/permissions/server");
  const { hasAnyPermission } = await import("@/lib/permissions/check");
  const user = await requireAuth();
  if (!hasAnyPermission(user, ["quote:write", "quote:approve"])) {
    return actionError("İmzalama yetkisi yok");
  }
  const { generateSignedQuotePdf } = await import(
    "@/lib/services/quote-pdf-service"
  );
  try {
    const result = await generateSignedQuotePdf(quoteId, user.id);
    if (!result) return actionError("İmzalı PDF oluşturulamadı");
    revalidateQuote(quoteId);
    return actionSuccess({ pdfVersionId: result.pdfVersionId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İmzalama hatası");
  }
}

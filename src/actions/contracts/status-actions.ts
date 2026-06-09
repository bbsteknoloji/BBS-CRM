"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  contractIdSchema,
  contractStatusActionSchema,
  contractRenewSchema,
  formDataToObject,
  parseFieldErrors,
} from "@/lib/validations/contract";
import {
  activateContract,
  signContract,
  suspendContract,
  resumeContract,
  terminateContract,
  expireContract,
} from "@/lib/services/contract-service";
import { renewContract } from "@/lib/services/contract-renewal-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

function revalidateContract(contractId: string) {
  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/dashboard");
}

export async function signContractAction(
  contractId: string
): Promise<ActionResult<{ pdfVersionId: string }>> {
  const user = await requirePermission("contract:write");
  const parsed = contractIdSchema.safeParse({ id: contractId });
  if (!parsed.success) return actionError("Geçersiz sözleşme");
  try {
    const result = await signContract(user, contractId);
    if (!result) return actionError("Sözleşme bulunamadı");
    revalidateContract(contractId);
    return actionSuccess({ pdfVersionId: result.pdfVersionId });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İmzalama başarısız");
  }
}

export async function activateContractAction(
  contractId: string
): Promise<ActionResult> {
  const user = await requirePermission("contract:write");
  const parsed = contractIdSchema.safeParse({ id: contractId });
  if (!parsed.success) return actionError("Geçersiz sözleşme");
  try {
    const c = await activateContract(user, contractId);
    if (!c) return actionError("Sözleşme bulunamadı");
    revalidateContract(contractId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function suspendContractAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("contract:write");
  const raw = formDataToObject(formData);
  const parsed = contractStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const c = await suspendContract(
      user,
      parsed.data.contractId,
      parsed.data.reason
    );
    if (!c) return actionError("Sözleşme bulunamadı");
    revalidateContract(parsed.data.contractId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function resumeContractAction(
  contractId: string
): Promise<ActionResult> {
  const user = await requirePermission("contract:write");
  try {
    const c = await resumeContract(user, contractId);
    if (!c) return actionError("Sözleşme bulunamadı");
    revalidateContract(contractId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function terminateContractAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requirePermission("contract:terminate");
  const raw = formDataToObject(formData);
  const parsed = contractStatusActionSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const c = await terminateContract(
      user,
      parsed.data.contractId,
      parsed.data.reason
    );
    if (!c) return actionError("Sözleşme bulunamadı");
    revalidateContract(parsed.data.contractId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function expireContractAction(
  contractId: string
): Promise<ActionResult> {
  const user = await requirePermission("contract:write");
  try {
    const c = await expireContract(user, contractId);
    if (!c) return actionError("Sözleşme bulunamadı");
    revalidateContract(contractId);
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "İşlem başarısız");
  }
}

export async function renewContractAction(
  formData: FormData
): Promise<ActionResult<{ contractId: string; contractNumber: string }>> {
  const user = await requirePermission("contract:renew");
  const raw = formDataToObject(formData);
  const parsed = contractRenewSchema.safeParse({
    ...raw,
    newEndDate: raw.newEndDate || undefined,
    notes: raw.notes || undefined,
  });
  if (!parsed.success) {
    return actionError("Geçersiz veri", parseFieldErrors(parsed.error));
  }
  try {
    const result = await renewContract(user, parsed.data);
    if (!result) return actionError("Sözleşme bulunamadı");
    revalidateContract(parsed.data.contractId);
    revalidatePath(`/contracts/${result.id}`);
    return actionSuccess({
      contractId: result.id,
      contractNumber: result.number,
    });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Yenileme başarısız");
  }
}

export async function generateContractPdfAction(
  contractId: string
): Promise<ActionResult<{ pdfVersionId: string; wordDocumentId: string }>> {
  const { requireAuth } = await import("@/lib/permissions/server");
  const { hasAnyPermission } = await import("@/lib/permissions/check");
  const user = await requireAuth();
  if (!hasAnyPermission(user, ["contract:write", "contract:renew"])) {
    return actionError("Belge oluşturma yetkisi yok");
  }
  const { generateContractDocuments, generateContractPdf } = await import(
    "@/lib/services/contract-pdf-service"
  );
  try {
    const wordResult = await generateContractDocuments(contractId, user.id);
    if (!wordResult) return actionError("Word belgesi oluşturulamadı");
    const pdfResult = await generateContractPdf(contractId, user.id);
    if (!pdfResult) return actionError("PDF oluşturulamadı");
    revalidateContract(contractId);
    return actionSuccess({
      pdfVersionId: pdfResult.pdfVersionId,
      wordDocumentId: wordResult.wordDocumentId,
    });
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Belge hatası");
  }
}

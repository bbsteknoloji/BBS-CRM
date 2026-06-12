"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { companyFormSchema, parseFieldErrors } from "@/lib/validations/company";
import { updateCompany, setCompanyActive } from "@/lib/services/company-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateCompanyAction(
  id: string,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await requirePermission("company:manage");

  const parsed = companyFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
  });

  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    await updateCompany(user, id, parsed.data);
    revalidatePath("/companies");
    revalidatePath(`/companies/${id}/edit`);
    return actionSuccess(undefined);
  } catch {
    return actionError("Firma güncellenemedi.");
  }
}

export async function toggleCompanyStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> {
  const user = await requirePermission("company:manage");

  try {
    await setCompanyActive(user, id, isActive);
    revalidatePath("/companies");
    return actionSuccess(undefined);
  } catch {
    return actionError("Firma durumu güncellenemedi.");
  }
}

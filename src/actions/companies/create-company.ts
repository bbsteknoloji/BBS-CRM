"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { companyFormSchema, parseFieldErrors } from "@/lib/validations/company";
import { createCompany } from "@/lib/services/company-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createCompanyAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
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
    const company = await createCompany(user, parsed.data);
    revalidatePath("/companies");
    return actionSuccess({ id: company.id });
  } catch {
    return actionError("Firma oluşturulamadı.");
  }
}

export async function createCompanyAndRedirect(formData: FormData) {
  const result = await createCompanyAction(formData);
  if (result.success) {
    redirect(`/companies/${result.data.id}/edit`);
  }
  return result;
}

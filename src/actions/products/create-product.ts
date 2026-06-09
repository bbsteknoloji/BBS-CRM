"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  parseFieldErrors,
  parseProductFormData,
} from "@/lib/validations/product";
import { createProduct } from "@/lib/services/product-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function createProductAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("product:create");

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    const id = await createProduct(user, parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "Bu ürün kodu zaten kayıtlı."
        : "Ürün oluşturulamadı.";
    return actionError(message);
  }
}

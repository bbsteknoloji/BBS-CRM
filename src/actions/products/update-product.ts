"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import {
  parseFieldErrors,
  parseProductFormData,
  productIdSchema,
} from "@/lib/validations/product";
import { updateProduct } from "@/lib/services/product-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("product:update");

  const idParsed = productIdSchema.safeParse({ id: productId });
  if (!idParsed.success) {
    return actionError("Geçersiz ürün");
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return actionError("Form doğrulama hatası", parseFieldErrors(parsed.error));
  }

  try {
    const id = await updateProduct(user, productId, parsed.data);
    if (!id) return actionError("Ürün bulunamadı");

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    return actionSuccess({ id });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "Bu ürün kodu başka bir üründe kullanılıyor."
        : "Ürün güncellenemedi.";
    return actionError(message);
  }
}

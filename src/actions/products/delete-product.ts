"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { productIdSchema } from "@/lib/validations/product";
import { deleteProduct } from "@/lib/services/product-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteProductAction(
  productId: string
): Promise<ActionResult> {
  const user = await requirePermission("product:delete");

  const parsed = productIdSchema.safeParse({ id: productId });
  if (!parsed.success) {
    return actionError("Geçersiz ürün");
  }

  const ok = await deleteProduct(user, productId);
  if (!ok) {
    return actionError("Ürün silinemedi veya bulunamadı.");
  }

  revalidatePath("/products");
  return actionSuccess(undefined);
}

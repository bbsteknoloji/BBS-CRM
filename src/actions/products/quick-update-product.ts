"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { quickUpdateProductFields } from "@/lib/services/product-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

const schema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(255),
  unit: z.string().trim().min(1).max(30),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
  currency: z.enum(["TRY", "USD", "EUR"]),
  isActive: z.boolean(),
});

export async function quickUpdateProductAction(
  productId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("product:update");

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Geçersiz veri";
    return actionError(first);
  }

  try {
    const id = await quickUpdateProductFields(user, productId, parsed.data);
    if (!id) return actionError("Ürün bulunamadı");
    revalidatePath("/products");
    return actionSuccess({ id });
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "Bu ürün kodu başka bir üründe kullanılıyor."
        : "Ürün güncellenemedi.";
    return actionError(msg);
  }
}

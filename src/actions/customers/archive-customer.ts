"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { customerIdSchema } from "@/lib/validations/customer";
import { archiveCustomer } from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function archiveCustomerAction(
  customerId: string
): Promise<ActionResult> {
  const user = await requirePermission("customer:write");

  const parsed = customerIdSchema.safeParse({ id: customerId });
  if (!parsed.success) {
    return actionError("Geçersiz müşteri");
  }

  const ok = await archiveCustomer(user, customerId);
  if (!ok) {
    return actionError("Müşteri arşivlenemedi.");
  }

  revalidatePath("/customers");
  return actionSuccess(undefined);
}

export async function archiveCustomerAndRedirect(customerId: string) {
  const result = await archiveCustomerAction(customerId);
  if (result.success) {
    redirect("/customers");
  }
  return result;
}

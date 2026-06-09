"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { archiveCustomer } from "@/lib/services/customer-service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function deleteCustomerAction(
  customerId: string
): Promise<ActionResult> {
  const user = await requirePermission("customer:delete");
  try {
    const ok = await archiveCustomer(user, customerId);
    if (!ok) return actionError("Müşteri bulunamadı");
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Müşteri silinemedi");
  }
}

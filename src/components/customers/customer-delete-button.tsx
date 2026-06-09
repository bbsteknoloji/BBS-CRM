"use client";

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deleteCustomerAction } from "@/actions/customers/delete-customer";

type Props = {
  customerId: string;
  customerName: string;
};

export function CustomerDeleteButton({ customerId, customerName }: Props) {
  return (
    <DeleteConfirmDialog
      label="Müşteriyi Sil"
      description={`"${customerName}" müşterisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      onDelete={() => deleteCustomerAction(customerId)}
      redirectTo="/customers"
    />
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveCustomerAction } from "@/actions/customers/archive-customer";

export function CustomerArchiveButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Bu müşteriyi arşivlemek istediğinize emin misiniz?"
          )
        ) {
          return;
        }
        startTransition(async () => {
          const res = await archiveCustomerAction(customerId);
          if (res.success) {
            toast.success("Müşteri arşivlendi");
            router.push("/customers");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <Archive className="mr-2 h-4 w-4" />
      Arşivle
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/actions/products/delete-product";

type Props = {
  productId: string;
  productName: string;
};

export function ProductDeleteButton({ productId, productName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const ok = window.confirm(
      `"${productName}" ürününü silmek istediğinize emin misiniz?`
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        toast.success("Ürün silindi");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {pending ? "Siliniyor…" : "Sil"}
    </Button>
  );
}

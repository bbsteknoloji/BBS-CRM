"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  label: string;
  description?: string;
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  redirectTo: string;
};

export function DeleteConfirmDialog({
  label,
  description,
  onDelete,
  redirectTo,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await onDelete();
      if (result.success) {
        toast.success("Başarıyla silindi");
        setOpen(false);
        router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(result.error ?? "Silinemedi");
      }
    });
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Sil
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Silmek istediğinize emin misiniz?</DialogTitle>
            <DialogDescription>
              {description ?? (
                <>
                  <strong>{label}</strong> kalıcı olarak silinecek. Bu işlem
                  geri alınamaz.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {pending ? "Siliniyor…" : "Evet, sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

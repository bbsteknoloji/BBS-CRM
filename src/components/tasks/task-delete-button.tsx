"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTaskAction } from "@/actions/tasks/delete-task";

type Props = {
  taskId: string;
  taskTitle: string;
};

export function TaskDeleteButton({ taskId, taskTitle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const ok = window.confirm(
      `"${taskTitle}" görevini silmek istediğinize emin misiniz?`
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.success) {
        toast.success("Görev silindi");
        router.push("/tasks");
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

"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/types";

type Props = {
  label?: string;
  onUpload: (formData: FormData) => Promise<ActionResult<{ documentId: string }>>;
};

export function EntityFileUpload({
  label = "Dosya yükle",
  onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await onUpload(fd);
      if (res.success) {
        toast.success("Dosya yüklendi");
        router.refresh();
      } else toast.error(res.error ?? "Yükleme hatası");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {pending ? "Yükleniyor…" : label}
      </Button>
    </div>
  );
}

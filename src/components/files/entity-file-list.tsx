"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import { formatFileSize } from "@/lib/utils/file-format";
import { format } from "@/lib/utils/date-format";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { FileModuleBadge } from "./file-module-badge";
import { FileTypeBadge } from "./file-type-badge";
import { deleteFileAction } from "@/actions/files/delete-file";

type Props = {
  items: FileCenterItem[];
  canDownload: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
};

/** Modül detay sekmelerinde kullanılır — PremiumDataTable compact */
export function EntityFileList({
  items,
  canDownload,
  canDelete = false,
  emptyMessage = "Dosya yok.",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Bu dosya silinsin mi?")) return;
    startTransition(async () => {
      const res = await deleteFileAction(id);
      if (res.success) {
        toast.success("Dosya silindi");
        router.refresh();
      } else {
        toast.error(res.error ?? "Silinemedi");
      }
    });
  }

  const columns = useMemo<ColumnDef<FileCenterItem>[]>(
    () => [
      {
        id: "fileName",
        header: "Dosya",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.fileName}</span>
        ),
      },
      {
        id: "module",
        header: "Modül",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <FileModuleBadge module={row.original.module} />
            <FileTypeBadge fileType={row.original.fileType} />
          </div>
        ),
      },
      {
        id: "size",
        header: "Boyut",
        cell: ({ row }) => formatFileSize(row.original.sizeBytes),
      },
      {
        id: "date",
        header: "Tarih",
        cell: ({ row }) => format(row.original.createdAt, "date"),
      },
      {
        id: "actions",
        header: () => <span className="block w-full text-right">İşlem</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2 text-sm">
            <a
              href={row.original.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Görüntüle
            </a>
            {canDownload ? (
              <a
                href={row.original.downloadUrl}
                className="text-primary hover:underline"
              >
                İndir
              </a>
            ) : null}
            <Link
              href={row.original.detailPath}
              className="text-primary hover:underline"
            >
              Kayıt
            </Link>
            {canDelete && row.original.canDelete ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleDelete(row.original.id)}
                className="text-destructive hover:underline disabled:opacity-50"
              >
                Sil
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDownload, canDelete, pending]
  );

  return (
    <PremiumDataTable
      data={items}
      columns={columns}
      compact
      emptyMessage={emptyMessage}
    />
  );
}

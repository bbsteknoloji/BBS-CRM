"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import { formatFileSize } from "@/lib/utils/file-format";
import { format } from "@/lib/utils/date-format";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { PremiumTableIconButton } from "@/components/premium/premium-table-actions";
import { FileModuleBadge } from "./file-module-badge";
import { FileTypeBadge } from "./file-type-badge";
import { FileDetailPanel } from "./file-detail-panel";
import { deleteFileAction } from "@/actions/files/delete-file";
import { ExternalLink, Download, Info } from "lucide-react";

type Props = {
  items: FileCenterItem[];
  canDownload: boolean;
  canDelete: boolean;
};

export function FileCenterTable({ items, canDownload, canDelete }: Props) {
  const [selected, setSelected] = useState<FileCenterItem | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(documentId: string) {
    if (!confirm("Bu dosya silinsin mi?")) return;
    startTransition(async () => {
      const res = await deleteFileAction(documentId);
      if (res.success) {
        toast.success("Dosya silindi");
        setSelected(null);
        window.location.reload();
      } else toast.error(res.error);
    });
  }

  const columns = useMemo<ColumnDef<FileCenterItem>[]>(
    () => [
      {
        id: "fileName",
        header: "Dosya",
        cell: ({ row }) => (
          <div className="flex min-w-[160px] items-center gap-2">
            <span className="font-medium">{row.original.fileName}</span>
            <FileTypeBadge fileType={row.original.fileType} variant="premium" />
          </div>
        ),
      },
      {
        id: "module",
        header: "Modül",
        cell: ({ row }) => (
          <FileModuleBadge module={row.original.module} variant="premium" />
        ),
      },
      {
        id: "customer",
        header: "Müşteri",
        cell: ({ row }) => (
          <Link
            href={`/customers/${row.original.customerId}`}
            className="hover:underline"
          >
            {row.original.customerName}
          </Link>
        ),
      },
      {
        id: "size",
        header: "Boyut",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatFileSize(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: "date",
        header: "Tarih",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {format(row.original.createdAt, "date")}
          </span>
        ),
      },
      {
        id: "uploader",
        header: "Yükleyen",
        cell: ({ row }) =>
          row.original.uploadedBy
            ? `${row.original.uploadedBy.firstName} ${row.original.uploadedBy.lastName}`
            : "—",
      },
      {
        id: "actions",
        header: () => <span className="block w-full text-right">İşlem</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <PremiumTableIconButton
              href={row.original.viewUrl}
              target="_blank"
              rel="noreferrer"
              title="Görüntüle"
            >
              <ExternalLink className="h-4 w-4" />
            </PremiumTableIconButton>
            {canDownload ? (
              <PremiumTableIconButton
                href={row.original.downloadUrl}
                title="İndir"
              >
                <Download className="h-4 w-4" />
              </PremiumTableIconButton>
            ) : null}
            <PremiumTableIconButton
              title="Detay"
              onClick={() => setSelected(row.original)}
            >
              <Info className="h-4 w-4" />
            </PremiumTableIconButton>
          </div>
        ),
      },
    ],
    [canDownload]
  );

  return (
    <>
      <PremiumDataTable
        data={items}
        columns={columns}
        className="min-w-[720px]"
      />
      <FileDetailPanel
        item={selected}
        onClose={() => setSelected(null)}
        canDownload={canDownload}
        canDelete={canDelete && !pending}
        onDelete={handleDelete}
      />
    </>
  );
}

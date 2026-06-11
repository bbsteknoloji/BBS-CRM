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
import { ExternalLink, Download, Info, Trash2 } from "lucide-react";

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
            {canDelete && row.original.canDelete ? (
              <PremiumTableIconButton
                title="Sil"
                className={`hover:bg-destructive/10 hover:text-destructive${pending ? " opacity-50 pointer-events-none" : ""}`}
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </PremiumTableIconButton>
            ) : null}
          </div>
        ),
      },
    ],
    [canDownload, canDelete, pending]
  );

  return (
    <>
      {/* Mobil kart görünümü */}
      <div className="space-y-2 sm:hidden">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Kayıt bulunamadı.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-hover rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {item.fileName}
                    </span>
                    <FileTypeBadge fileType={item.fileType} variant="premium" />
                  </div>
                  <Link
                    href={`/customers/${item.customerId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {item.customerName}
                  </Link>
                </div>
                <FileModuleBadge module={item.module} variant="premium" />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Boyut</span>
                <span className="tabular-nums">{formatFileSize(item.sizeBytes)}</span>
                <span className="text-muted-foreground">Tarih</span>
                <span>{format(item.createdAt, "date")}</span>
                {item.uploadedBy && (
                  <>
                    <span className="text-muted-foreground">Yükleyen</span>
                    <span>
                      {item.uploadedBy.firstName} {item.uploadedBy.lastName}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 pt-1.5 border-t border-border/40">
                <PremiumTableIconButton
                  href={item.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Görüntüle"
                >
                  <ExternalLink className="h-4 w-4" />
                </PremiumTableIconButton>
                {canDownload && (
                  <PremiumTableIconButton href={item.downloadUrl} title="İndir">
                    <Download className="h-4 w-4" />
                  </PremiumTableIconButton>
                )}
                <PremiumTableIconButton
                  title="Detay"
                  onClick={() => setSelected(item)}
                >
                  <Info className="h-4 w-4" />
                </PremiumTableIconButton>
                {canDelete && item.canDelete && (
                  <PremiumTableIconButton
                    title="Sil"
                    className={`hover:bg-destructive/10 hover:text-destructive${pending ? " opacity-50 pointer-events-none" : ""}`}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </PremiumTableIconButton>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Masaüstü tablo görünümü */}
      <div className="hidden sm:block">
        <PremiumDataTable
          data={items}
          columns={columns}
          className="min-w-[720px]"
        />
      </div>

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

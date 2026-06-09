"use client";

import Link from "next/link";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import { formatFileSize, FILE_MODULE_LABELS } from "@/lib/utils/file-format";
import { format } from "@/lib/utils/date-format";
import { PremiumDetailPanel } from "@/components/premium/premium-detail-panel";
import { FileModuleBadge } from "./file-module-badge";
import { FileTypeBadge } from "./file-type-badge";
import { cn } from "@/lib/utils";

type Props = {
  item: FileCenterItem | null;
  onClose: () => void;
  canDownload: boolean;
  canDelete: boolean;
  onDelete?: (documentId: string) => void;
};

export function FileDetailPanel({
  item,
  onClose,
  canDownload,
  canDelete,
  onDelete,
}: Props) {
  if (!item) return null;

  return (
    <PremiumDetailPanel open title={item.fileName} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <FileModuleBadge module={item.module} variant="premium" />
        <FileTypeBadge fileType={item.fileType} variant="premium" />
      </div>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Modül</dt>
          <dd>{FILE_MODULE_LABELS[item.module]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Müşteri</dt>
          <dd>
            <Link href={`/customers/${item.customerId}`} className="hover:underline">
              {item.customerName}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Boyut</dt>
          <dd>{formatFileSize(item.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tarih</dt>
          <dd>{format(item.createdAt, "datetime")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Yükleyen</dt>
          <dd>
            {item.uploadedBy
              ? `${item.uploadedBy.firstName} ${item.uploadedBy.lastName}`
              : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-col gap-2">
        <a
          href={item.viewUrl}
          target="_blank"
          rel="noreferrer"
          className="premium-btn-primary inline-flex h-10 items-center justify-center rounded-md text-sm font-medium"
        >
          Görüntüle
        </a>
        {canDownload ? (
          <a
            href={item.downloadUrl}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input text-sm font-medium hover:bg-muted"
          >
            İndir
          </a>
        ) : null}
        <Link
          href={item.detailPath}
          className="text-center text-sm text-primary hover:underline"
        >
          Bağlı kayda git
        </Link>
        {canDelete && item.canDelete && item.source === "document" && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(item.sourceId)}
            className={cn("text-sm text-destructive hover:underline")}
          >
            Dosyayı sil
          </button>
        ) : null}
      </div>
    </PremiumDetailPanel>
  );
}

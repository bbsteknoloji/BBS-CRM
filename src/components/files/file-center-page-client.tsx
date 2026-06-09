"use client";

import type { FileCenterItem } from "@/lib/services/file-center-types";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { FileCenterShell } from "./file-center-shell";
import { FileCenterFilters } from "./file-center-filters";
import { FileCenterTable } from "./file-center-table";
import { FileCenterPagination } from "./file-center-pagination";

type Props = {
  items: FileCenterItem[];
  customers: { id: string; legalName: string }[];
  uploaders: { id: string; firstName: string; lastName: string }[];
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
  canDownload: boolean;
  canDelete: boolean;
};

export function FileCenterPageClient({
  items,
  customers,
  uploaders,
  shown,
  hasMore,
  nextCursor,
  canDownload,
  canDelete,
}: Props) {
  return (
    <FileCenterShell>
      <div className="space-y-6">
        <FileCenterFilters customers={customers} uploaders={uploaders} />
        {items.length === 0 ? (
          <PremiumEmptyState
            title="Dosya bulunamadı"
            description="Filtrelere uygun kayıt yok. Filtreleri temizleyip tekrar deneyin."
          />
        ) : (
          <>
            <FileCenterTable
              items={items}
              canDownload={canDownload}
              canDelete={canDelete}
            />
            <FileCenterPagination
              shown={shown}
              hasMore={hasMore}
              nextCursor={nextCursor}
            />
          </>
        )}
      </div>
    </FileCenterShell>
  );
}

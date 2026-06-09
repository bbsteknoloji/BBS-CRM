"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export function FileCenterPagination({
  shown,
  hasMore,
  nextCursor,
}: Props) {
  return (
    <PremiumListPagination
      basePath="/files"
      total={shown}
      shown={shown}
      hasMore={hasMore}
      nextCursor={nextCursor}
    />
  );
}

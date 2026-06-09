"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  total: number;
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export function VisitListPagination(props: Props) {
  return <PremiumListPagination basePath="/visits" {...props} />;
}

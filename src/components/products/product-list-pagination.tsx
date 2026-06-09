"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  total: number;
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export function ProductListPagination(props: Props) {
  return <PremiumListPagination basePath="/products" {...props} />;
}

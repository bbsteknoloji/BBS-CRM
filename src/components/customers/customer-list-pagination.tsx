"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  shown: number;
};

export function CustomerListPagination(props: Props) {
  return <PremiumListPagination basePath="/customers" {...props} />;
}

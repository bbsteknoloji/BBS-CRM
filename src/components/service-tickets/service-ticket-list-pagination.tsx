"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  total: number;
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export function ServiceTicketListPagination(props: Props) {
  return <PremiumListPagination basePath="/service-tickets" {...props} />;
}

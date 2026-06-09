"use client";

import { PremiumListPagination } from "@/components/premium/premium-list-pagination";

type Props = {
  total: number;
  shown: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export function TaskListPagination(props: Props) {
  return <PremiumListPagination basePath="/tasks" {...props} />;
}

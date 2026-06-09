import { PremiumTableSkeleton } from "@/components/premium/premium-data-table";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomersTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-lg" />
      <PremiumTableSkeleton rows={8} cols={6} />
    </div>
  );
}

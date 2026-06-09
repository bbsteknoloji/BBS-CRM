import type { CustomerStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";

const VARIANT: Record<
  CustomerStatus,
  "default" | "success" | "warning" | "muted" | "secondary"
> = {
  LEAD: "warning",
  ACTIVE: "success",
  INACTIVE: "muted",
  CHURNED: "secondary",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge variant={VARIANT[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>
  );
}

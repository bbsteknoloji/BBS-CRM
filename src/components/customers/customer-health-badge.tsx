import type { CustomerHealthStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { HEALTH_STATUS_LABELS } from "@/lib/services/customer-health-service";

const VARIANT: Record<
  CustomerHealthStatus,
  "default" | "success" | "warning" | "secondary"
> = {
  HEALTHY: "success",
  WARNING: "warning",
  RISK: "secondary",
};

export function CustomerHealthBadge({
  status,
}: {
  status: CustomerHealthStatus | null | undefined;
}) {
  if (!status) return null;
  return (
    <Badge variant={VARIANT[status]}>{HEALTH_STATUS_LABELS[status]}</Badge>
  );
}

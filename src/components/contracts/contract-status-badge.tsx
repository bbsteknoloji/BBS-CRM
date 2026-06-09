import type { ContractStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_STATUS_LABELS } from "@/lib/services/contract-state-machine";

const VARIANT: Record<
  ContractStatus,
  "default" | "success" | "warning" | "muted" | "secondary" | "outline"
> = {
  DRAFT: "muted",
  SIGNED: "default",
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "outline",
  TERMINATED: "secondary",
  RENEWED: "default",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge variant={VARIANT[status]}>{CONTRACT_STATUS_LABELS[status]}</Badge>
  );
}

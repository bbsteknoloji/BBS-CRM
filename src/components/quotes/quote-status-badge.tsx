import type { QuoteStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS_LABELS } from "@/lib/services/quote-state-machine";

const VARIANT: Record<
  QuoteStatus,
  "default" | "success" | "warning" | "muted" | "secondary" | "outline"
> = {
  DRAFT: "muted",
  SENT: "default",
  REVISION: "warning",
  APPROVED: "success",
  REJECTED: "secondary",
  EXPIRED: "outline",
  CONVERTED: "success",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant={VARIANT[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>
  );
}

import type { ServiceTicketStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { SERVICE_TICKET_STATUS_LABELS } from "@/lib/services/service-ticket-state-machine";

const VARIANT: Record<
  ServiceTicketStatus,
  "default" | "success" | "warning" | "muted" | "secondary" | "outline"
> = {
  OPEN: "default",
  IN_PROGRESS: "warning",
  WAITING_CUSTOMER: "outline",
  RESOLVED: "success",
  CLOSED: "muted",
};

export function ServiceTicketStatusBadge({
  status,
}: {
  status: ServiceTicketStatus;
}) {
  return (
    <Badge variant={VARIANT[status]}>
      {SERVICE_TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}

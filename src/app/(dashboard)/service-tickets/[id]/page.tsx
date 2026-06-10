import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ServiceTicketStatusBadge } from "@/components/service-tickets/service-ticket-status-badge";
import { ServiceTicketDetailActions } from "@/components/service-tickets/service-ticket-detail-actions";
import {
  ServiceTicketDetailTabs,
} from "@/components/service-tickets/service-ticket-detail-tabs";
import { parseServiceTicketTab } from "@/lib/service-tickets/service-ticket-tabs";
import { PremiumPageContainer } from "@/components/premium";
import {
  getServiceTicketDetail,
  listServiceTicketActivities,
  listServiceTicketAuditLogs,
  listUsersForServiceAssign,
} from "@/lib/services/service-ticket-service";
import { serviceTicketIdSchema } from "@/lib/validations/service-ticket";
import { listServiceTicketVisits } from "@/lib/services/visit-service";
import { listEntityDocuments } from "@/lib/services/file-center-service";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("service:read");
  const t = await getServiceTicketDetail(user, id);
  return { title: t ? t.ticketNo : "Servis talebi" };
}

export default async function ServiceTicketDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await requirePermission("service:read");
  const canWrite = hasPermission(user, "service:write");
  const canAssign = hasPermission(user, "service:assign");
  const canClose = hasPermission(user, "service:close");
  const canDelete = hasPermission(user, "service:delete");
  const canPdf = hasPermission(user, "service:pdf");
  const canVisitRead = hasPermission(user, "visit:read");
  const canVisitWrite = hasPermission(user, "visit:write");
  const canFileRead = hasPermission(user, "file:read");
  const canFileDownload = hasPermission(user, "file:download");
  const canDocumentUpload = hasPermission(user, "document:upload");
  const { id } = await params;
  const { tab } = await searchParams;

  if (!serviceTicketIdSchema.safeParse({ id }).success) notFound();

  const [ticket, activities, auditLogs, users, visits, files] = await Promise.all([
    getServiceTicketDetail(user, id),
    listServiceTicketActivities(user, id),
    listServiceTicketAuditLogs(user, id),
    listUsersForServiceAssign(),
    canVisitRead ? listServiceTicketVisits(user, id) : Promise.resolve([]),
    canFileRead
      ? listEntityDocuments(user, "SERVICE_TICKET", id)
      : Promise.resolve([]),
  ]);

  if (!ticket) notFound();

  return (
    <>
      <Header
        title={ticket.title}
        description={`${ticket.ticketNo} · ${ticket.customer.legalName}`}
        meta={<ServiceTicketStatusBadge status={ticket.status} />}
        pageActions={
          <ServiceTicketDetailActions
            serviceTicketId={id}
            ticketNo={ticket.ticketNo}
            status={ticket.status}
            canWrite={canWrite}
            canAssign={canAssign}
            canClose={canClose}
            canDelete={canDelete}
            canPdf={canPdf}
            users={users}
          />
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <ServiceTicketDetailTabs
            ticket={ticket}
            activeTab={parseServiceTicketTab(tab)}
            activities={activities}
            auditLogs={auditLogs}
            visits={visits}
            canVisitRead={canVisitRead}
            canVisitWrite={canVisitWrite}
            files={files}
            canFileRead={canFileRead}
            canFileDownload={canFileDownload}
            canDocumentUpload={canDocumentUpload}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

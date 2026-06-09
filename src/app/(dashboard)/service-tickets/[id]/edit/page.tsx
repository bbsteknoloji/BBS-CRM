import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateServiceTicketAction } from "@/actions/service-tickets/update-service-ticket";
import {
  getServiceTicketDetail,
  listCustomersForServiceSelect,
  listContractsForServiceSelect,
  listUsersForServiceAssign,
} from "@/lib/services/service-ticket-service";
import { serviceTicketIdSchema } from "@/lib/validations/service-ticket";
import { isServiceTicketEditable } from "@/lib/services/service-ticket-state-machine";

type Props = { params: Promise<{ id: string }> };

export default async function EditServiceTicketPage({ params }: Props) {
  const user = await requirePermission("service:write");
  const { id } = await params;
  if (!serviceTicketIdSchema.safeParse({ id }).success) notFound();

  const ticket = await getServiceTicketDetail(user, id);
  if (!ticket) notFound();
  if (!isServiceTicketEditable(ticket.status)) {
    redirect(`/service-tickets/${id}`);
  }

  const [customers, contracts, users] = await Promise.all([
    listCustomersForServiceSelect(user),
    listContractsForServiceSelect(user, ticket.customer.id),
    listUsersForServiceAssign(),
  ]);

  return (
    <>
      <Header
        title="Servis talebi düzenle"
        description={ticket.ticketNo}
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <ServiceTicketForm
            customers={customers}
            contracts={contracts}
            users={users}
            defaultValues={{
              title: ticket.title,
              customerId: ticket.customer.id,
              contractId: ticket.contract?.id ?? "",
              description: ticket.description ?? "",
              priority: ticket.priority,
              assignedUserId: ticket.assignedUser?.id ?? "",
            }}
            submitLabel="Kaydet"
            onSubmit={updateServiceTicketAction.bind(null, id)}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

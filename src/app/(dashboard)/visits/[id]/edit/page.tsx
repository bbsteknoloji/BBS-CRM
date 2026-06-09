import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { VisitForm } from "@/components/visits/visit-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateVisitAction } from "@/actions/visits/update-visit";
import {
  getVisitDetail,
  listCustomersForVisitSelect,
  listContractsForVisitSelect,
  listServiceTicketsForVisitSelect,
  listUsersForVisitAssign,
} from "@/lib/services/visit-service";
import { visitIdSchema } from "@/lib/validations/visit";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("visit:write");
  const v = await getVisitDetail(user, id);
  return { title: v ? `${v.visitNo} — Düzenle` : "Düzenle" };
}

export default async function EditVisitPage({ params }: Props) {
  const user = await requirePermission("visit:write");
  const { id } = await params;
  if (!visitIdSchema.safeParse({ id }).success) notFound();

  const visit = await getVisitDetail(user, id);
  if (!visit) notFound();

  const [customers, contracts, serviceTickets, users] = await Promise.all([
    listCustomersForVisitSelect(user),
    listContractsForVisitSelect(user, visit.customer.id),
    listServiceTicketsForVisitSelect(user, visit.customer.id),
    listUsersForVisitAssign(),
  ]);

  const boundUpdate = updateVisitAction.bind(null, id);

  return (
    <>
      <Header
        title="Saha ziyareti düzenle"
        description={visit.visitNo}
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <VisitForm
            customers={customers}
            contracts={contracts}
            serviceTickets={serviceTickets}
            users={users}
            defaultValues={{
              customerId: visit.customer.id,
              contractId: visit.contract?.id,
              serviceTicketId: visit.serviceTicket?.id,
              userId: visit.user.id,
              visitDate: visit.visitDate.toISOString().slice(0, 10),
              description: visit.description,
              result: visit.result ?? "",
              nextVisitDate: visit.nextVisitDate
                ? visit.nextVisitDate.toISOString().slice(0, 10)
                : "",
            }}
            submitLabel="Kaydet"
            onSubmit={boundUpdate}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

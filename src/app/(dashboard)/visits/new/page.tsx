import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { VisitForm } from "@/components/visits/visit-form";
import { PremiumPageContainer } from "@/components/premium";
import { createVisitAction } from "@/actions/visits/create-visit";
import {
  listCustomersForVisitSelect,
  listContractsForVisitSelect,
  listServiceTicketsForVisitSelect,
  listUsersForVisitAssign,
} from "@/lib/services/visit-service";

export const metadata = { title: "Yeni saha ziyareti" };

type Props = {
  searchParams: Promise<{
    customerId?: string;
    contractId?: string;
    serviceTicketId?: string;
  }>;
};

export default async function NewVisitPage({ searchParams }: Props) {
  const user = await requirePermission("visit:write");
  const sp = await searchParams;

  const [customers, contracts, serviceTickets, users] = await Promise.all([
    listCustomersForVisitSelect(user),
    sp.customerId
      ? listContractsForVisitSelect(user, sp.customerId)
      : Promise.resolve([]),
    sp.customerId
      ? listServiceTicketsForVisitSelect(user, sp.customerId)
      : Promise.resolve([]),
    listUsersForVisitAssign(),
  ]);

  return (
    <>
      <Header
        title="Yeni saha ziyareti"
        description="Müşteri ziyaret kaydı oluştur"
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <VisitForm
            customers={customers}
            contracts={contracts}
            serviceTickets={serviceTickets}
            users={users}
            defaultValues={{
              customerId: sp.customerId,
              contractId: sp.contractId,
              serviceTicketId: sp.serviceTicketId,
              userId: user.id,
              visitDate: new Date().toISOString().slice(0, 10),
            }}
            submitLabel="Oluştur"
            onSubmit={createVisitAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

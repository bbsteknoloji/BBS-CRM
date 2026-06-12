import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { PremiumPageContainer } from "@/components/premium";
import { createServiceTicketAction } from "@/actions/service-tickets/create-service-ticket";
import {
  listCustomersForServiceSelect,
  listContractsForServiceSelect,
  listUsersForServiceAssign,
} from "@/lib/services/service-ticket-service";

export const metadata = { title: "Yeni servis talebi" };

type Props = {
  searchParams: Promise<{ customerId?: string; contractId?: string }>;
};

export default async function NewServiceTicketPage({ searchParams }: Props) {
  const user = await requirePermission("service:write");
  const sp = await searchParams;

  const [customers, contracts, users] = await Promise.all([
    listCustomersForServiceSelect(user),
    sp.customerId
      ? listContractsForServiceSelect(user, sp.customerId)
      : Promise.resolve([]),
    listUsersForServiceAssign(user),
  ]);

  return (
    <>
      <Header
        title="Yeni servis talebi"
        description="Teknik servis kaydı oluştur"
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <ServiceTicketForm
            customers={customers}
            contracts={contracts}
            users={users}
            defaultValues={{
              customerId: sp.customerId,
              contractId: sp.contractId,
              priority: "MEDIUM",
            }}
            submitLabel="Oluştur"
            onSubmit={createServiceTicketAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

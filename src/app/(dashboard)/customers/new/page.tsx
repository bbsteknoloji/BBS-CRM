import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { CustomerForm } from "@/components/customers/customer-form";
import { PremiumPageContainer } from "@/components/premium";
import { createCustomerAction } from "@/actions/customers/create-customer";
import { getAssignableUsers } from "@/lib/services/customer-service";

export const metadata = { title: "Yeni müşteri" };

export default async function NewCustomerPage() {
  const user = await requirePermission("customer:write");
  const users = await getAssignableUsers(user);
  const userOptions = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
  }));

  return (
    <>
      <Header
        title="Yeni müşteri"
        description="B2B müşteri kaydı oluşturun"
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <CustomerForm
            users={userOptions}
            submitLabel="Müşteri oluştur"
            onSubmit={createCustomerAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

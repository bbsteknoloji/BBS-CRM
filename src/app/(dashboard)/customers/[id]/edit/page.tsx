import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { CustomerForm } from "@/components/customers/customer-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateCustomerAction } from "@/actions/customers/update-customer";
import {
  getCustomerDetail,
  customerToFormInput,
  getAssignableUsers,
} from "@/lib/services/customer-service";
import { customerIdSchema } from "@/lib/validations/customer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission("customer:read");
  const customer = await getCustomerDetail(user, id);
  return { title: customer ? `Düzenle: ${customer.legalName}` : "Düzenle" };
}

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("customer:write");
  const { id } = await params;
  const parsed = customerIdSchema.safeParse({ id });
  if (!parsed.success) notFound();

  const [customer, users] = await Promise.all([
    getCustomerDetail(user, id),
    getAssignableUsers(),
  ]);

  if (!customer) notFound();

  const userOptions = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
  }));

  const boundUpdate = updateCustomerAction.bind(null, id);

  return (
    <>
      <Header
        title="Müşteri düzenle"
        description={customer.legalName}
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <CustomerForm
            defaultValues={customerToFormInput(customer)}
            users={userOptions}
            submitLabel="Değişiklikleri kaydet"
            onSubmit={boundUpdate}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

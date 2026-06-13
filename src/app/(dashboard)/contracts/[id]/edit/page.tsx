import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ContractForm } from "@/components/contracts/contract-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateContractAction } from "@/actions/contracts/update-contract";
import {
  getContractDetail,
  listCustomersForContractSelect,
  listQuotesForContractSelect,
  listActiveProducts,
  listContractDeviceIds,
} from "@/lib/services/contract-service";
import { contractIdSchema } from "@/lib/validations/contract";
import { isContractEditable } from "@/lib/services/contract-state-machine";

type Props = { params: Promise<{ id: string }> };

export default async function EditContractPage({ params }: Props) {
  const user = await requirePermission("contract:write");
  const { id } = await params;
  if (!contractIdSchema.safeParse({ id }).success) notFound();

  const contract = await getContractDetail(user, id);
  if (!contract) notFound();
  if (!isContractEditable(contract.status)) {
    redirect(`/contracts/${id}`);
  }

  const [customers, quotes, products, deviceIds] = await Promise.all([
    listCustomersForContractSelect(user),
    listQuotesForContractSelect(user, contract.customer.id),
    listActiveProducts(user),
    listContractDeviceIds(user, id),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    unitPrice: Number(p.unitPrice.toString()),
    taxRate: Number(p.taxRate.toString()),
  }));

  const defaultValues = {
    title: contract.title,
    customerId: contract.customer.id,
    quoteId: contract.quoteId ?? "",
    startDate: contract.startDate.toISOString().slice(0, 10),
    endDate: contract.endDate
      ? contract.endDate.toISOString().slice(0, 10)
      : "",
    renewalNoticeDays: contract.renewalNoticeDays,
    autoRenew: contract.autoRenew,
    currency: contract.currency as "TRY" | "USD" | "EUR",
    notes: contract.notes ?? "",
    terms: contract.terms ?? "",
    invoiceNumber: contract.invoiceNumber ?? "",
    lineItems: contract.lineItems.map((l) => ({
      productId: l.productId ?? "",
      description: l.description,
      quantity: Number(l.quantity.toString()),
      unit: l.unit,
      unitPrice: Number(l.unitPrice.toString()),
      taxRate: Number(l.taxRate.toString()),
    })),
    deviceIds,
  };

  return (
    <>
      <Header
        title="Sözleşme düzenle"
        description={contract.number}
      />
      <PageShell>
        <PremiumPageContainer className="max-w-4xl">
          <ContractForm
            customers={customers}
            quotes={quotes}
            products={productOptions}
            defaultValues={defaultValues}
            submitLabel="Kaydet"
            onSubmit={updateContractAction.bind(null, id)}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

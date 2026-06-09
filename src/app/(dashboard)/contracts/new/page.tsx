import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ContractForm } from "@/components/contracts/contract-form";
import { PremiumPageContainer } from "@/components/premium";
import { createContractAction } from "@/actions/contracts/create-contract";
import {
  listCustomersForContractSelect,
  listQuotesForContractSelect,
  listActiveProducts,
} from "@/lib/services/contract-service";

export const metadata = { title: "Yeni sözleşme" };

type Props = {
  searchParams: Promise<{ customerId?: string; quoteId?: string }>;
};

export default async function NewContractPage({ searchParams }: Props) {
  const user = await requirePermission("contract:write");
  const sp = await searchParams;

  const [customers, quotes, products] = await Promise.all([
    listCustomersForContractSelect(user),
    listQuotesForContractSelect(user, sp.customerId),
    listActiveProducts(),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    unitPrice: Number(p.unitPrice.toString()),
    taxRate: Number(p.taxRate.toString()),
  }));

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  return (
    <>
      <Header title="Yeni sözleşme" description="Bağımsız veya teklif bağlantılı" />
      <PageShell>
        <PremiumPageContainer className="max-w-4xl">
          <ContractForm
            customers={customers}
            quotes={quotes}
            products={productOptions}
            defaultValues={{
              customerId: sp.customerId,
              quoteId: sp.quoteId,
              startDate: today,
              endDate: nextYear.toISOString().slice(0, 10),
              renewalNoticeDays: 30,
              lineItems: [
                {
                  description: "Hot Spot Gateway bakım ve destek hizmeti",
                  quantity: 1,
                  unit: "adet",
                  unitPrice: 0,
                  taxRate: 20,
                },
              ],
            }}
            submitLabel="Oluştur"
            onSubmit={createContractAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

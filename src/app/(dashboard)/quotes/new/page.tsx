import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PremiumPageContainer } from "@/components/premium";
import { createQuoteAction } from "@/actions/quotes/create-quote";
import {
  listCustomersForQuoteSelect,
  listActiveProducts,
} from "@/lib/services/quote-service";

export const metadata = { title: "Yeni teklif" };

export default async function NewQuotePage() {
  const user = await requirePermission("quote:write");

  const [customers, products] = await Promise.all([
    listCustomersForQuoteSelect(user),
    listActiveProducts(user),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    unitPrice: Number(p.unitPrice.toString()),
    taxRate: Number(p.taxRate.toString()),
    type: p.type,
  }));

  return (
    <>
      <Header title="Yeni teklif" description="Teklif oluştur" />
      <PageShell>
        <PremiumPageContainer className="max-w-4xl">
          <QuoteForm
            customers={customers}
            products={productOptions}
            submitLabel="Teklif oluştur"
            onSubmit={createQuoteAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

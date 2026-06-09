import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateQuoteAction } from "@/actions/quotes/update-quote";
import {
  getQuoteDetail,
  quoteToFormInput,
  listCustomersForQuoteSelect,
  listActiveProducts,
} from "@/lib/services/quote-service";
import { isQuoteEditable } from "@/lib/services/quote-state-machine";
import { quoteIdSchema } from "@/lib/validations/quote";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("quote:write");
  const { id } = await params;
  if (!quoteIdSchema.safeParse({ id }).success) notFound();

  const [quote, customers, products] = await Promise.all([
    getQuoteDetail(user, id),
    listCustomersForQuoteSelect(user),
    listActiveProducts(),
  ]);

  if (!quote || !isQuoteEditable(quote.status)) notFound();

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
      <Header title="Teklif düzenle" description={quote.number} />
      <PageShell>
        <PremiumPageContainer className="max-w-4xl">
          <QuoteForm
            customers={customers}
            products={productOptions}
            defaultValues={quoteToFormInput(quote)}
            submitLabel="Kaydet"
            onSubmit={updateQuoteAction.bind(null, id)}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

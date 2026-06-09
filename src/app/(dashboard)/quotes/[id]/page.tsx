import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { QuoteDetailActions } from "@/components/quotes/quote-detail-actions";
import { QuoteDetailTabs } from "@/components/quotes/quote-detail-tabs";
import { parseQuoteTab } from "@/lib/quotes/quote-tabs";
import { PremiumPageContainer } from "@/components/premium";
import {
  getQuoteDetail,
  listQuoteActivities,
  listQuotePdfVersions,
  listQuoteRevisions,
  listQuoteDocuments,
} from "@/lib/services/quote-service";
import { quoteIdSchema } from "@/lib/validations/quote";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("quote:read");
  const q = await getQuoteDetail(user, id);
  return { title: q ? q.number : "Teklif" };
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await requirePermission("quote:read");
  const canWrite = hasPermission(user, "quote:write");
  const canApprove = hasPermission(user, "quote:approve");
  const canDelete = hasPermission(user, "quote:delete");
  const { id } = await params;
  const { tab } = await searchParams;

  if (!quoteIdSchema.safeParse({ id }).success) notFound();

  const [quote, activities, pdfVersions, revisions, documents] =
    await Promise.all([
      getQuoteDetail(user, id),
      listQuoteActivities(user, id),
      listQuotePdfVersions(user, id),
      listQuoteRevisions(user, id),
      listQuoteDocuments(user, id),
    ]);

  if (!quote) notFound();

  // Prisma Decimal → number (Client Component'e plain object geçmeli)
  const serializedQuote = {
    ...quote,
    subtotal: Number(quote.subtotal),
    taxTotal: Number(quote.taxTotal),
    total: Number(quote.total),
    lineItems: quote.lineItems.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      taxRate: Number(l.taxRate),
      lineTotal: Number(l.lineTotal),
    })),
  };

  return (
    <>
      <Header
        title={quote.title}
        description={`${quote.number} · ${quote.customer.legalName}`}
        meta={<QuoteStatusBadge status={quote.status} />}
        pageActions={
          <QuoteDetailActions
            quoteId={id}
            quoteNumber={quote.number}
            status={quote.status}
            canWrite={canWrite}
            canApprove={canApprove}
            canDelete={canDelete}
          />
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <QuoteDetailTabs
            quote={serializedQuote}
            activeTab={parseQuoteTab(tab)}
            activities={activities}
            pdfVersions={pdfVersions}
            revisions={revisions}
            documents={documents}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

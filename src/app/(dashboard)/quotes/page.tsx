import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { QuoteFilters } from "@/components/quotes/quote-filters";
import { QuoteTable } from "@/components/quotes/quote-table";
import { QuoteListPagination } from "@/components/quotes/quote-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { quoteListQuerySchema } from "@/lib/validations/quote";
import {
  listQuotes,
  listCustomersForQuoteSelect,
} from "@/lib/services/quote-service";

export const metadata = { title: "Teklifler" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function QuoteList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("quote:read");
  const params = searchParams;
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    customerId:
      typeof params.customerId === "string" ? params.customerId : undefined,
    dateFrom:
      typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };
  const query = quoteListQuerySchema.parse(raw);

  const [list, customers] = await Promise.all([
    listQuotes(user, query),
    listCustomersForQuoteSelect(user),
  ]);

  return (
    <>
      <PremiumSection>
        <QuoteFilters customers={customers} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            title="Teklif bulunamadı"
            description="Filtrelere uygun teklif kaydı yok."
          />
        ) : (
          <>
            <QuoteTable data={list.items} />
            <QuoteListPagination
              total={list.total}
              shown={list.items.length}
              hasMore={list.hasMore}
              nextCursor={list.nextCursor}
            />
          </>
        )}
      </PremiumSection>
    </>
  );
}

export default async function QuotesPage({ searchParams }: Props) {
  const user = await requirePermission("quote:read");
  const canWrite = hasPermission(user, "quote:write");

  return (
    <>
      <Header
        title="Teklifler"
        description="Satış teklif yönetimi"
        pageActions={
          canWrite ? (
            <Button asChild size="sm">
              <Link href="/quotes/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni teklif
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <Suspense
            fallback={
              <PremiumSection>
                <PremiumTableSkeleton rows={8} cols={6} />
              </PremiumSection>
            }
          >
            <QuoteList searchParams={await searchParams} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { VisitFilters } from "@/components/visits/visit-filters";
import { VisitTable } from "@/components/visits/visit-table";
import { VisitListPagination } from "@/components/visits/visit-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { visitListQuerySchema } from "@/lib/validations/visit";
import {
  listVisits,
  listCustomersForVisitSelect,
} from "@/lib/services/visit-service";

export const metadata = { title: "Saha Ziyaretleri" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function VisitList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("visit:read");
  const params = searchParams;
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    customerId:
      typeof params.customerId === "string" ? params.customerId : undefined,
    serviceTicketId:
      typeof params.serviceTicketId === "string"
        ? params.serviceTicketId
        : undefined,
    upcoming:
      typeof params.upcoming === "string" ? params.upcoming : undefined,
    dateFrom:
      typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };
  const query = visitListQuerySchema.parse(raw);

  const [list, customers] = await Promise.all([
    listVisits(user, query),
    listCustomersForVisitSelect(user),
  ]);

  return (
    <>
      <PremiumSection>
        <VisitFilters customers={customers} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            title="Saha ziyareti bulunamadı"
            description="Filtrelere uygun kayıt yok."
          />
        ) : (
          <>
            <VisitTable data={list.items} />
            <VisitListPagination
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

export default async function VisitsPage({ searchParams }: Props) {
  const user = await requirePermission("visit:read");
  const canWrite = hasPermission(user, "visit:write");

  return (
    <>
      <Header
        title="Saha Ziyaretleri"
        description="Müşteri saha ziyaret kayıtları"
        pageActions={
          canWrite ? (
            <Button asChild size="sm">
              <Link href="/visits/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni ziyaret
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
                <PremiumTableSkeleton rows={8} cols={5} />
              </PremiumSection>
            }
          >
            <VisitList searchParams={await searchParams} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

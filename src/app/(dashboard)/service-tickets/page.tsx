import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ServiceTicketFilters } from "@/components/service-tickets/service-ticket-filters";
import { ServiceTicketTable } from "@/components/service-tickets/service-ticket-table";
import { ServiceTicketListPagination } from "@/components/service-tickets/service-ticket-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { serviceTicketListQuerySchema } from "@/lib/validations/service-ticket";
import {
  listServiceTickets,
  listCustomersForServiceSelect,
} from "@/lib/services/service-ticket-service";

export const metadata = { title: "Servis Talepleri" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ServiceTicketList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("service:read");
  const params = searchParams;
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    priority:
      typeof params.priority === "string" ? params.priority : undefined,
    customerId:
      typeof params.customerId === "string" ? params.customerId : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };
  const query = serviceTicketListQuerySchema.parse(raw);

  const [list, customers] = await Promise.all([
    listServiceTickets(user, query),
    listCustomersForServiceSelect(user),
  ]);

  return (
    <>
      <PremiumSection>
        <ServiceTicketFilters customers={customers} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            title="Servis talebi bulunamadı"
            description="Filtrelere uygun kayıt yok."
          />
        ) : (
          <>
            <ServiceTicketTable data={list.items} />
            <ServiceTicketListPagination
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

export default async function ServiceTicketsPage({ searchParams }: Props) {
  const user = await requirePermission("service:read");
  const canWrite = hasPermission(user, "service:write");

  return (
    <>
      <Header
        title="Servis Talepleri"
        description="Teknik servis ve destek talepleri"
        pageActions={
          canWrite ? (
            <Button asChild size="sm">
              <Link href="/service-tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni talep
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
            <ServiceTicketList searchParams={await searchParams} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

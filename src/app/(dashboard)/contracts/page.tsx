import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ContractFilters } from "@/components/contracts/contract-filters";
import { ContractTable } from "@/components/contracts/contract-table";
import { ContractListPagination } from "@/components/contracts/contract-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { contractListQuerySchema } from "@/lib/validations/contract";
import {
  listContracts,
  listCustomersForContractSelect,
} from "@/lib/services/contract-service";

export const metadata = { title: "Sözleşmeler" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ContractList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("contract:read");
  const params = searchParams;
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    customerId:
      typeof params.customerId === "string" ? params.customerId : undefined,
    expiringWithinDays:
      typeof params.expiringWithinDays === "string"
        ? params.expiringWithinDays
        : undefined,
    dateFrom:
      typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };
  const query = contractListQuerySchema.parse(raw);

  const [list, customers] = await Promise.all([
    listContracts(user, query),
    listCustomersForContractSelect(user),
  ]);

  return (
    <>
      <PremiumSection>
        <ContractFilters customers={customers} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            title="Sözleşme bulunamadı"
            description="Filtrelere uygun sözleşme kaydı yok."
          />
        ) : (
          <>
            <ContractTable data={list.items} />
            <ContractListPagination
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

export default async function ContractsPage({ searchParams }: Props) {
  const user = await requirePermission("contract:read");
  const canWrite = hasPermission(user, "contract:write");

  return (
    <>
      <Header
        title="Sözleşmeler"
        description="Sözleşme yönetimi ve süre takibi"
        pageActions={
          canWrite ? (
            <Button asChild size="sm">
              <Link href="/contracts/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni sözleşme
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
                <PremiumTableSkeleton rows={8} cols={7} />
              </PremiumSection>
            }
          >
            <ContractList searchParams={await searchParams} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

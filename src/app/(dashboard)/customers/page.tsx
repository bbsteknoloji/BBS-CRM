import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users, Upload } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerListPagination } from "@/components/customers/customer-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
} from "@/components/premium";
import { customerListQuerySchema } from "@/lib/validations/customer";
import {
  listCustomers,
  getDistinctCities,
  getAssignableUsers,
} from "@/lib/services/customer-service";
import { CustomersTableSkeleton } from "@/components/customers/customers-table-skeleton";

export const metadata = { title: "Müşteriler" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CustomerListContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("customer:read");
  const canWrite = hasPermission(user, "customer:write");

  const raw = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    status:
      typeof searchParams.status === "string"
        ? searchParams.status
        : undefined,
    assignedToId:
      typeof searchParams.assignedToId === "string"
        ? searchParams.assignedToId
        : undefined,
    city:
      typeof searchParams.city === "string" ? searchParams.city : undefined,
    cursor:
      typeof searchParams.cursor === "string"
        ? searchParams.cursor
        : undefined,
    limit: searchParams.limit,
  };

  const parsed = customerListQuerySchema.safeParse(raw);
  const query = parsed.success
    ? parsed.data
    : customerListQuerySchema.parse({});

  const [list, cities, users] = await Promise.all([
    listCustomers(user, query),
    getDistinctCities(user),
    getAssignableUsers(),
  ]);

  const userOptions = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
  }));

  const hasFilters = !!(query.q || query.status || query.assignedToId || query.city);

  return (
    <>
      <PremiumSection>
        <CustomerFilters cities={cities} users={userOptions} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            icon={<Users className="h-10 w-10" />}
            title={hasFilters ? "Sonuç bulunamadı" : "Henüz müşteri yok"}
            description={
              hasFilters
                ? "Filtreleri değiştirerek tekrar deneyin."
                : "İlk B2B müşterinizi ekleyerek başlayın."
            }
            actionLabel={canWrite && !hasFilters ? "Yeni müşteri" : undefined}
            actionHref={canWrite && !hasFilters ? "/customers/new" : undefined}
          />
        ) : (
          <>
            <CustomerTable data={list.items} />
            <CustomerListPagination
              total={list.total}
              hasMore={list.hasMore}
              nextCursor={list.nextCursor}
              shown={list.items.length}
            />
          </>
        )}
      </PremiumSection>
    </>
  );
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const user = await requirePermission("customer:read");
  const canWrite = hasPermission(user, "customer:write");
  const canImport = hasPermission(user, "customer:import");
  const params = await searchParams;

  return (
    <>
      <Header
        title="Müşteriler"
        description="B2B müşteri yönetimi"
        pageActions={
          canWrite || canImport ? (
            <div className="flex gap-2">
              {canImport ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/customers/import">
                    <Upload className="mr-2 h-4 w-4" />
                    İçe Aktar
                  </Link>
                </Button>
              ) : null}
              {canWrite ? (
                <Button asChild size="sm">
                  <Link href="/customers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni müşteri
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <Suspense fallback={<CustomersTableSkeleton />}>
            <CustomerListContent searchParams={params} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { Plus, Package } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductTable } from "@/components/products/product-table";
import { ProductListPagination } from "@/components/products/product-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { productListQuerySchema } from "@/lib/validations/product";
import { listProducts } from "@/lib/services/product-service";

export const metadata = { title: "Ürün Kataloğu" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ProductListContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("product:read");

  const raw = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    isActive:
      typeof searchParams.isActive === "string"
        ? searchParams.isActive
        : undefined,
    cursor:
      typeof searchParams.cursor === "string" ? searchParams.cursor : undefined,
    limit: searchParams.limit,
  };

  const query = productListQuerySchema.parse(raw);
  const list = await listProducts(user, query);
  const hasFilters = !!(query.q || query.isActive);

  return (
    <>
      <PremiumSection>
        <ProductFilters />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            icon={<Package className="h-10 w-10" />}
            title={hasFilters ? "Sonuç bulunamadı" : "Henüz ürün yok"}
            description={
              hasFilters
                ? "Filtreleri değiştirerek tekrar deneyin."
                : "İlk ürününüzü kataloğa ekleyin."
            }
            actionLabel={
              !hasFilters && hasPermission(user, "product:create")
                ? "Yeni ürün"
                : undefined
            }
            actionHref={
              !hasFilters && hasPermission(user, "product:create")
                ? "/products/new"
                : undefined
            }
          />
        ) : (
          <>
            <ProductTable data={list.items} />
            <ProductListPagination
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

export default async function ProductsPage({ searchParams }: Props) {
  const user = await requirePermission("product:read");
  const canCreate = hasPermission(user, "product:create");
  const params = await searchParams;

  return (
    <>
      <Header
        title="Ürün Kataloğu"
        description="Teklif ve sözleşmeler için ürün / hizmet kataloğu"
        pageActions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni ürün
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
            <ProductListContent searchParams={params} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

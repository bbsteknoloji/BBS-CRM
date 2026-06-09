import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PremiumPageContainer } from "@/components/premium";
import { CustomersTableSkeleton } from "@/components/customers/customers-table-skeleton";

export default function CustomersLoading() {
  return (
    <>
      <Header title="Müşteriler" description="Yükleniyor…" />
      <PageShell>
        <PremiumPageContainer>
          <CustomersTableSkeleton />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

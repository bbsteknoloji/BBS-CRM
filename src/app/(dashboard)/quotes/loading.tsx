import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumTableSkeleton,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuotesLoading() {
  return (
    <>
      <Header title="Teklifler" description="Yükleniyor…" />
      <PageShell>
        <PremiumPageContainer>
          <PremiumSection>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <PremiumTableSkeleton rows={7} cols={6} />
            </div>
          </PremiumSection>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

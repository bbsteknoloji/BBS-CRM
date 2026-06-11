import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumTableSkeleton,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";

export default function FilesLoading() {
  return (
    <>
      <Header title="Dosya Merkezi" description="Yükleniyor…" />
      <PageShell>
        <PremiumPageContainer>
          <PremiumSection>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <PremiumTableSkeleton rows={8} cols={7} />
            </div>
          </PremiumSection>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

import { requireAnyPermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import { PremiumPageContainer } from "@/components/premium";

export const metadata = { title: "Raporlar" };

export default async function ReportsPage() {
  await requireAnyPermission(["report:read", "report:export"]);

  return (
    <>
      <Header title="Raporlar" description="Raporlama ve dışa aktarma" />
      <PageShell>
        <PremiumPageContainer>
          <PlaceholderPage
            module="Raporlar"
            phase="Rapor ekranları sonraki fazlarda geliştirilecek."
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

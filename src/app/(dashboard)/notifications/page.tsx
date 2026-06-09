import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import { PremiumPageContainer } from "@/components/premium";

export const metadata = { title: "Bildirimler" };

export default async function NotificationsPage() {
  await requirePermission("notification:read");

  return (
    <>
      <Header title="Bildirimler" description="Sistem bildirimleri" />
      <PageShell>
        <PremiumPageContainer>
          <PlaceholderPage
            module="Bildirimler"
            phase="Faz 5.7 — bildirim arayüzü sırada."
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

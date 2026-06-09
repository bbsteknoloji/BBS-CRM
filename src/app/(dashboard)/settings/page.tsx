import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPage } from "@/components/shared/placeholder-page";
import { PremiumPageContainer } from "@/components/premium";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requirePermission("settings:manage");

  return (
    <>
      <Header title="Ayarlar" description="Sistem ve kullanıcı ayarları" />
      <PageShell>
        <PremiumPageContainer>
          <PlaceholderPage
            module="Ayarlar"
            phase="Ayar ekranları sonraki fazlarda geliştirilecek."
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

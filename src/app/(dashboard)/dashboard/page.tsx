import { requireAuth } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PremiumPageContainer } from "@/components/premium";
import { getDashboardSummary } from "@/lib/services/dashboard-summary-service";

export const metadata = { title: "Ana Panel" };

export default async function DashboardPage() {
  const user = await requireAuth();

  const summary = await getDashboardSummary(user, {
    canCustomers: hasPermission(user, "customer:read"),
    canContracts: hasPermission(user, "contract:read"),
    canQuotes: hasPermission(user, "quote:read"),
    canService: hasPermission(user, "service:read"),
    canTasks: hasPermission(user, "task:read"),
    canVisits: hasPermission(user, "visit:read"),
    canFiles: hasPermission(user, "file:read"),
  });

  return (
    <>
      <Header
        title="Ana Panel"
        description="BBS Teknoloji operasyon özeti"
      />
      <PageShell>
        <PremiumPageContainer>
          <DashboardOverview
            summary={summary}
            showContracts={hasPermission(user, "contract:read")}
            showVisits={hasPermission(user, "visit:read")}
            showFiles={hasPermission(user, "file:read")}
            showTasks={hasPermission(user, "task:read")}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

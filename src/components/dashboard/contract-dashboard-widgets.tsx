import Link from "next/link";
import { PremiumKpiCard } from "@/components/premium/premium-card";
import type { ContractDashboardStats } from "@/lib/services/contract-dashboard-service";
import { EXPIRY_BUCKETS } from "@/lib/services/contract-dashboard-service";
import { cn } from "@/lib/utils";

type Props = {
  stats: ContractDashboardStats;
  canReadContracts: boolean;
};

export function ContractDashboardWidgets({ stats, canReadContracts }: Props) {
  if (!canReadContracts) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sözleşmeler
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PremiumKpiCard
            title="Aktif sözleşme"
            value={String(stats.activeTotal)}
          />
          <PremiumKpiCard
            title="Bu ay bitecekler"
            value={String(stats.expiringThisMonth)}
            href="/contracts?status=ACTIVE"
          />
          <PremiumKpiCard
            title="Süresi geçen (aktif)"
            value={String(stats.overdueCount)}
          />
          <PremiumKpiCard
            title="Yenilenenler"
            value={String(stats.renewedTotal)}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Yaklaşan bitiş uyarıları</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPIRY_BUCKETS.map((days) => (
            <Link
              key={days}
              href={`/contracts?status=ACTIVE&expiringWithinDays=${days}`}
              className="glass-panel hover-lift rounded-lg p-4 transition-colors"
            >
              <p className="text-sm text-muted-foreground">
                {days} gün içinde bitecek
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {stats.expiryBuckets[days]}
              </p>
            </Link>
          ))}
          <Link
            href="/contracts?status=ACTIVE"
            className={cn(
              "glass-panel hover-lift rounded-lg border-destructive/30 p-4 transition-colors"
            )}
          >
            <p className="text-sm text-muted-foreground">Süresi geçmiş (aktif)</p>
            <p className="text-xl font-semibold tabular-nums text-destructive">
              {stats.expiryBuckets.overdue}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

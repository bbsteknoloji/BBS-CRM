import Link from "next/link";
import {
  PremiumKpiCard,
  PremiumWidgetCard,
} from "@/components/premium/premium-card";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { formatMoney } from "@/lib/utils/money-format";
import { format } from "@/lib/utils/date-format";
import { FILE_MODULE_LABELS } from "@/lib/utils/file-format";
import type { DashboardSummary } from "@/lib/services/dashboard-summary-service";
import { ContractDashboardWidgets } from "./contract-dashboard-widgets";
import { CustomerHealthBadge } from "@/components/customers/customer-health-badge";
import type { CustomerHealthStatus } from "@prisma/client";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/utils/task-labels";

type Props = {
  summary: DashboardSummary;
  showContracts: boolean;
  showVisits: boolean;
  showFiles: boolean;
  showTasks: boolean;
};

export function DashboardOverview({
  summary,
  showContracts,
  showVisits,
  showFiles,
  showTasks,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <PremiumKpiCard
          title="Toplam müşteri"
          value={String(summary.totalCustomers)}
        />
        <PremiumKpiCard
          title="Aktif sözleşme"
          value={String(summary.activeContracts)}
        />
        <PremiumKpiCard
          title="Bu ay bitecek"
          value={String(summary.expiringThisMonth)}
        />
        <PremiumKpiCard
          title="Açık servis"
          value={String(summary.openServiceTickets)}
          href="/service-tickets?status=OPEN"
        />
        <PremiumKpiCard
          title="Bekleyen teklif"
          value={String(summary.pendingQuotes)}
          href="/quotes"
        />
        <PremiumKpiCard
          title="Aylık sözleşme geliri"
          value={formatMoney(summary.monthlyContractRevenue)}
        />
      </div>

      {showTasks ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <PremiumKpiCard
            title="Açık görevler"
            value={String(summary.openTasks)}
            href="/tasks"
          />
          <PremiumKpiCard
            title="Geciken görevler"
            value={String(summary.overdueTasks)}
            href="/tasks"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PremiumWidgetCard title="Son aktiviteler">
          {summary.recentActivities.length === 0 ? (
            <PremiumEmptyState
              title="Aktivite Yok"
              description="Aktivite yok."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.recentActivities.map((a) => (
                <li key={a.id} className="border-b border-border/40 pb-2 last:border-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.customer.legalName} ·{" "}
                    {format(a.occurredAt, "datetime")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PremiumWidgetCard>

        <PremiumWidgetCard title="Riskli müşteriler">
          {summary.riskyCustomers.length === 0 ? (
            <PremiumEmptyState
              title="Veri Yok"
              description="Riskli müşteri yok."
            />
          ) : (
            <ul className="space-y-2">
              {summary.riskyCustomers.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex items-center justify-between text-sm hover:underline"
                  >
                    <span>{c.legalName}</span>
                    <CustomerHealthBadge
                      status={c.healthStatus as CustomerHealthStatus}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PremiumWidgetCard>

        {showTasks ? (
          <PremiumWidgetCard title="Bana atanmış görevler">
            {summary.myAssignedTasks.length === 0 ? (
              <PremiumEmptyState
                title="Görev Yok"
                description="Size atanmış açık görev yok."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.myAssignedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="border-b border-border/40 pb-2 last:border-0"
                  >
                    <Link
                      href={`/tasks/${t.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {TASK_STATUS_LABELS[t.status]} ·{" "}
                      {TASK_PRIORITY_LABELS[t.priority]}
                      {t.dueAt ? ` · ${format(t.dueAt, "date")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/tasks"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Tüm görevler
            </Link>
          </PremiumWidgetCard>
        ) : null}

        <PremiumWidgetCard title="Açık servis talepleri">
          <p className="text-2xl font-semibold tabular-nums">
            {summary.openServiceTickets}
          </p>
          <Link
            href="/service-tickets"
            className="text-xs text-primary hover:underline"
          >
            Tüm talepler
          </Link>
        </PremiumWidgetCard>

        {showVisits ? (
          <>
            <PremiumWidgetCard title="Son saha ziyaretleri">
              {summary.recentVisits.length === 0 ? (
                <PremiumEmptyState
                  title="Kayıt Yok"
                  description="Kayıt yok."
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {summary.recentVisits.map((v) => (
                    <li key={v.id} className="border-b border-border/40 pb-2 last:border-0">
                      <Link
                        href={`/visits/${v.id}`}
                        className="font-medium hover:underline"
                      >
                        {v.customer.legalName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {format(v.visitDate, "date")} · {v.user.firstName}{" "}
                        {v.user.lastName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/visits"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Tüm ziyaretler
              </Link>
            </PremiumWidgetCard>

            <PremiumWidgetCard title="Planlanan ziyaretler">
              {summary.upcomingVisits.length === 0 ? (
                <PremiumEmptyState
                  title="Kayıt Yok"
                  description="Yaklaşan ziyaret yok."
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {summary.upcomingVisits.map((v) => (
                    <li key={v.id} className="border-b border-border/40 pb-2 last:border-0">
                      <Link
                        href={`/visits/${v.id}`}
                        className="font-medium hover:underline"
                      >
                        {v.customer.legalName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {v.nextVisitDate
                          ? format(v.nextVisitDate, "date")
                          : "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/visits?upcoming=1"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Planlanan liste
              </Link>
            </PremiumWidgetCard>
          </>
        ) : null}

        {showFiles ? (
          <PremiumWidgetCard title="Son eklenen dosyalar">
            {summary.recentFiles.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Dosya yok."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.recentFiles.map((f) => (
                  <li key={f.id} className="border-b border-border/40 pb-2 last:border-0">
                    <Link href="/files" className="font-medium hover:underline">
                      {f.fileName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {FILE_MODULE_LABELS[f.module]} ·{" "}
                      {format(f.createdAt, "date")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/files"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Dosya Merkezi
            </Link>
          </PremiumWidgetCard>
        ) : null}
      </div>

      {showContracts && summary.contractStats ? (
        <ContractDashboardWidgets
          stats={summary.contractStats}
          canReadContracts={showContracts}
        />
      ) : null}
    </div>
  );
}


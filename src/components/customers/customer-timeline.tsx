import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { format } from "@/lib/utils/date-format";
import type { ActivityType } from "@prisma/client";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  occurredAt: Date;
  user: { firstName: string; lastName: string } | null;
};

const TYPE_LABELS: Partial<Record<ActivityType, string>> = {
  NOTE: "Not",
  TASK_CREATED: "Görev",
  STATUS_CHANGE: "Durum",
  CALL: "Arama",
  EMAIL: "E-posta",
  MEETING: "Toplantı",
};

export function CustomerTimeline({ activities }: { activities: ActivityItem[] }) {
  if (!activities.length) {
    return (
      <PremiumEmptyState
        title="Aktivite Yok"
        description="Henüz aktivite kaydı yok."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {activities.map((a) => (
        <li
          key={a.id}
          className="relative border-l-2 border-border pl-4 pb-2 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={a.occurredAt.toISOString()}>
              {format(a.occurredAt, "datetime")}
            </time>
            {TYPE_LABELS[a.type] ? (
              <span className="rounded bg-muted px-1.5 py-0.5">
                {TYPE_LABELS[a.type]}
              </span>
            ) : null}
            {a.user ? (
              <span>
                {a.user.firstName} {a.user.lastName}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-medium text-sm">{a.title}</p>
          {a.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {a.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

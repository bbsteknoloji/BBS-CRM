import Link from "next/link";
import { Suspense } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskListPagination } from "@/components/tasks/task-list-pagination";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumEmptyState,
  PremiumTableSkeleton,
} from "@/components/premium";
import { taskListQuerySchema } from "@/lib/validations/task";
import {
  listTasks,
  listUsersForTaskAssign,
} from "@/lib/services/task-service";

export const metadata = { title: "Görevler" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function TaskListContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("task:read");

  const raw = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    status:
      typeof searchParams.status === "string" ? searchParams.status : undefined,
    priority:
      typeof searchParams.priority === "string"
        ? searchParams.priority
        : undefined,
    assignedToId:
      typeof searchParams.assignedToId === "string"
        ? searchParams.assignedToId
        : undefined,
    cursor:
      typeof searchParams.cursor === "string" ? searchParams.cursor : undefined,
    limit: searchParams.limit,
  };

  const query = taskListQuerySchema.parse(raw);
  const [list, users] = await Promise.all([
    listTasks(user, query),
    listUsersForTaskAssign(user),
  ]);
  const hasFilters = !!(
    query.q ||
    query.status ||
    query.priority ||
    query.assignedToId
  );

  return (
    <>
      <PremiumSection>
        <TaskFilters users={users} />
      </PremiumSection>
      <PremiumSection>
        {list.items.length === 0 ? (
          <PremiumEmptyState
            icon={<CheckSquare className="h-10 w-10" />}
            title={hasFilters ? "Sonuç bulunamadı" : "Henüz görev yok"}
            description={
              hasFilters
                ? "Filtreleri değiştirerek tekrar deneyin."
                : "İlk görevinizi oluşturun."
            }
            actionLabel={
              !hasFilters && hasPermission(user, "task:create")
                ? "Yeni görev"
                : undefined
            }
            actionHref={
              !hasFilters && hasPermission(user, "task:create")
                ? "/tasks/new"
                : undefined
            }
          />
        ) : (
          <>
            <TaskTable data={list.items} />
            <TaskListPagination
              total={list.total}
              shown={list.items.length}
              hasMore={list.hasMore}
              nextCursor={list.nextCursor}
            />
          </>
        )}
      </PremiumSection>
    </>
  );
}

export default async function TasksPage({ searchParams }: Props) {
  const user = await requirePermission("task:read");
  const canCreate = hasPermission(user, "task:create");
  const params = await searchParams;

  return (
    <>
      <Header
        title="Görevler"
        description="Operasyon görevleri ve takip"
        pageActions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni görev
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <Suspense
            fallback={
              <PremiumSection>
                <PremiumTableSkeleton rows={8} cols={6} />
              </PremiumSection>
            }
          >
            <TaskListContent searchParams={params} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

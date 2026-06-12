import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { PremiumPageContainer } from "@/components/premium";
import { createTaskAction } from "@/actions/tasks/create-task";
import {
  listCustomersForTaskSelect,
  listQuotesForTaskSelect,
  listContractsForTaskSelect,
  listUsersForTaskAssign,
} from "@/lib/services/task-service";

export const metadata = { title: "Yeni görev" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewTaskPage({ searchParams }: Props) {
  const user = await requirePermission("task:create");
  const params = await searchParams;
  const customerId =
    typeof params.customerId === "string" ? params.customerId : undefined;

  const [customers, quotes, contracts, users] = await Promise.all([
    listCustomersForTaskSelect(user),
    listQuotesForTaskSelect(user, customerId),
    listContractsForTaskSelect(user, customerId),
    listUsersForTaskAssign(user),
  ]);

  return (
    <>
      <Header title="Yeni görev" description="Görev oluştur" />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <TaskForm
            customers={customers}
            quotes={quotes}
            contracts={contracts}
            users={users}
            defaultValues={customerId ? { customerId } : undefined}
            submitLabel="Görev oluştur"
            onSubmit={createTaskAction}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

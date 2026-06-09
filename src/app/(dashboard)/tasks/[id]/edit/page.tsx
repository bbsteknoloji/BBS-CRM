import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateTaskAction } from "@/actions/tasks/update-task";
import {
  getTaskById,
  taskToFormInput,
  listCustomersForTaskSelect,
  listQuotesForTaskSelect,
  listContractsForTaskSelect,
  listUsersForTaskAssign,
} from "@/lib/services/task-service";

export const metadata = { title: "Görev düzenle" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditTaskPage({ params, searchParams }: Props) {
  const user = await requirePermission("task:update");
  const canDelete = hasPermission(user, "task:delete");

  const { id } = await params;
  const sp = await searchParams;
  const task = await getTaskById(user, id);
  if (!task) notFound();

  const customerId =
    typeof sp.customerId === "string"
      ? sp.customerId
      : task.customerId ?? undefined;

  const [customers, quotes, contracts, users] = await Promise.all([
    listCustomersForTaskSelect(user),
    listQuotesForTaskSelect(user, customerId),
    listContractsForTaskSelect(user, customerId),
    listUsersForTaskAssign(),
  ]);

  const boundUpdate = updateTaskAction.bind(null, id);

  return (
    <>
      <Header title="Görev düzenle" description={task.title} />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <TaskForm
            taskId={id}
            customers={customers}
            quotes={quotes}
            contracts={contracts}
            users={users}
            defaultValues={taskToFormInput(task)}
            submitLabel="Kaydet"
            onSubmit={boundUpdate}
            canDelete={canDelete}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

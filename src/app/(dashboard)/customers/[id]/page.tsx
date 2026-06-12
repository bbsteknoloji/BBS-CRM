import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { CustomerDeleteButton } from "@/components/customers/customer-delete-button";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import {
  CustomerDetailTabs,
} from "@/components/customers/customer-detail-tabs";
import { parseCustomerTab } from "@/lib/customers/customer-tabs";
import { CustomerArchiveButton } from "@/components/customers/customer-archive-button";
import { PremiumPageContainer } from "@/components/premium";
import {
  getCustomerDetail,
  listCustomerActivities,
  listCustomerTasks,
  listCustomerQuotes,
  listCustomerContracts,
  getAssignableUsers,
} from "@/lib/services/customer-service";
import { customerIdSchema } from "@/lib/validations/customer";
import { refreshCustomerHealthCache } from "@/lib/services/customer-health-service";
import { listCustomerServiceTickets } from "@/lib/services/service-ticket-service";
import { listCustomerVisits } from "@/lib/services/visit-service";
import { listCustomerFileCenterItems } from "@/lib/services/file-center-service";
import { CustomerHealthBadge } from "@/components/customers/customer-health-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission("customer:read");
  const customer = await getCustomerDetail(user, id);
  return {
    title: customer?.legalName ?? "Müşteri",
  };
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePermission("customer:read");
  const canWrite = hasPermission(user, "customer:write");
  const canDelete = hasPermission(user, "customer:delete");
  const canServiceRead = hasPermission(user, "service:read");
  const canServiceWrite = hasPermission(user, "service:write");
  const canVisitRead = hasPermission(user, "visit:read");
  const canVisitWrite = hasPermission(user, "visit:write");
  const canFileRead = hasPermission(user, "file:read");
  const canFileDownload = hasPermission(user, "file:download");
  const canFileDelete = hasPermission(user, "file:delete");
  const { id } = await params;
  const { tab } = await searchParams;

  const parsed = customerIdSchema.safeParse({ id });
  if (!parsed.success) notFound();

  const [
    customer,
    activities,
    tasks,
    quotes,
    contracts,
    users,
    serviceTickets,
    visits,
    customerFiles,
  ] = await Promise.all([
    getCustomerDetail(user, id),
    listCustomerActivities(user, id),
    listCustomerTasks(user, id),
    listCustomerQuotes(user, id),
    listCustomerContracts(user, id),
    getAssignableUsers(user),
    canServiceRead ? listCustomerServiceTickets(user, id) : Promise.resolve([]),
    canVisitRead ? listCustomerVisits(user, id) : Promise.resolve([]),
    canFileRead ? listCustomerFileCenterItems(user, id) : Promise.resolve([]),
  ]);

  if (!customer) notFound();

  const devices = customer.devices;

  const health = await refreshCustomerHealthCache(id);
  const customerWithHealth = {
    ...customer,
    healthStatus: health.status,
  };

  const userOptions = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
  }));

  return (
    <>
      <Header
        title={customer.legalName}
        description={customer.tradeName ?? customer.taxNumber ?? undefined}
        meta={
          <>
            <CustomerStatusBadge status={customer.status} />
            <CustomerHealthBadge status={customerWithHealth.healthStatus} />
            <span className="font-mono text-sm text-muted-foreground">
              {customer.taxNumber}
            </span>
          </>
        }
        pageActions={
          (canWrite || canDelete) ? (
            <>
              {canWrite && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/customers/${id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                  </Link>
                </Button>
              )}
              {canWrite && <CustomerArchiveButton customerId={id} />}
              {canDelete && (
                <CustomerDeleteButton
                  customerId={id}
                  customerName={customer.legalName}
                />
              )}
            </>
          ) : undefined
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <CustomerDetailTabs
            customer={customerWithHealth}
            activeTab={parseCustomerTab(tab)}
            canWrite={canWrite}
            activities={activities}
            tasks={tasks}
            users={userOptions}
            quotes={quotes}
            contracts={contracts}
            customerFiles={customerFiles}
            canFileRead={canFileRead}
            canFileDownload={canFileDownload}
            canFileDelete={canFileDelete}
            serviceTickets={serviceTickets}
            canServiceRead={canServiceRead}
            canServiceWrite={canServiceWrite}
            visits={visits}
            canVisitRead={canVisitRead}
            canVisitWrite={canVisitWrite}
            devices={devices}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

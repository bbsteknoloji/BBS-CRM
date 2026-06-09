import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { ContractDetailActions } from "@/components/contracts/contract-detail-actions";
import {
  ContractDetailTabs,
} from "@/components/contracts/contract-detail-tabs";
import { parseContractTab } from "@/lib/contracts/contract-tabs";
import { PremiumPageContainer } from "@/components/premium";
import {
  getContractDetail,
  listContractActivities,
  listContractPdfVersions,
  listContractRenewals,
  listContractDocuments,
  listContractAuditLogs,
} from "@/lib/services/contract-service";
import { contractIdSchema } from "@/lib/validations/contract";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("contract:read");
  const c = await getContractDetail(user, id);
  return { title: c ? c.number : "Sözleşme" };
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await requirePermission("contract:read");
  const canWrite = hasPermission(user, "contract:write");
  const canRenew = hasPermission(user, "contract:renew");
  const canTerminate = hasPermission(user, "contract:terminate");
  const canDelete = hasPermission(user, "contract:delete");
  const { id } = await params;
  const { tab } = await searchParams;

  if (!contractIdSchema.safeParse({ id }).success) notFound();

  const [
    contract,
    activities,
    pdfVersions,
    renewals,
    documents,
    auditLogs,
  ] = await Promise.all([
    getContractDetail(user, id),
    listContractActivities(user, id),
    listContractPdfVersions(user, id),
    listContractRenewals(user, id),
    listContractDocuments(user, id),
    listContractAuditLogs(user, id),
  ]);

  if (!contract) notFound();

  // Prisma Decimal → number (Client Component'e plain object geçmeli)
  const serializedContract = {
    ...contract,
    subtotal: Number(contract.subtotal),
    taxTotal: Number(contract.taxTotal),
    total: Number(contract.total),
    lineItems: contract.lineItems.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      taxRate: Number(l.taxRate),
      lineTotal: Number(l.lineTotal),
    })),
  };

  return (
    <>
      <Header
        title={contract.title}
        description={`${contract.number} · ${contract.customer.legalName}`}
        meta={<ContractStatusBadge status={contract.status} />}
        pageActions={
          <ContractDetailActions
            contractId={id}
            contractNumber={contract.number}
            status={contract.status}
            endDate={
              contract.endDate
                ? contract.endDate.toISOString().slice(0, 10)
                : null
            }
            canWrite={canWrite}
            canRenew={canRenew}
            canTerminate={canTerminate}
            canDelete={canDelete}
          />
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <ContractDetailTabs
            contract={serializedContract}
            activeTab={parseContractTab(tab)}
            activities={activities}
            pdfVersions={pdfVersions}
            renewals={renewals}
            documents={documents}
            auditLogs={auditLogs}
            canUpload={canWrite}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

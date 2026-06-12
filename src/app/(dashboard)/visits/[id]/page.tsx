import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  VisitDetailTabs,
  parseVisitTab,
} from "@/components/visits/visit-detail-tabs";
import { PremiumPageContainer } from "@/components/premium";
import {
  getVisitDetail,
  listVisitActivities,
  listVisitAuditLogs,
} from "@/lib/services/visit-service";
import { visitIdSchema } from "@/lib/validations/visit";
import { listEntityDocuments } from "@/lib/services/file-center-service";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requirePermission("visit:read");
  const v = await getVisitDetail(user, id);
  return { title: v ? v.visitNo : "Saha ziyareti" };
}

export default async function VisitDetailPage({ params, searchParams }: Props) {
  const user = await requirePermission("visit:read");
  const canWrite = hasPermission(user, "visit:write");
  const canFileRead = hasPermission(user, "file:read");
  const canFileDownload = hasPermission(user, "file:download");
  const canFileDelete = hasPermission(user, "file:delete");
  const canDocumentUpload = hasPermission(user, "document:upload");
  const { id } = await params;
  const { tab } = await searchParams;

  if (!visitIdSchema.safeParse({ id }).success) notFound();

  const [visit, activities, auditLogs, files] = await Promise.all([
    getVisitDetail(user, id),
    listVisitActivities(user, id),
    listVisitAuditLogs(user, id),
    canFileRead ? listEntityDocuments(user, "VISIT", id) : Promise.resolve([]),
  ]);

  if (!visit) notFound();

  return (
    <>
      <Header
        title={visit.visitNo}
        description={`${visit.customer.legalName} · ${visit.user.firstName} ${visit.user.lastName}`}
        pageActions={
          canWrite ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/visits/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <VisitDetailTabs
            visit={visit}
            activeTab={parseVisitTab(tab)}
            activities={activities}
            auditLogs={auditLogs}
            files={files}
            canFileRead={canFileRead}
            canFileDownload={canFileDownload}
            canFileDelete={canFileDelete}
            canDocumentUpload={canDocumentUpload}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

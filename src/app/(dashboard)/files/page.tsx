import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission, hasRole, isSuperAdmin } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { FileCenterPageClient } from "@/components/files/file-center-page-client";
import {
  PremiumPageContainer,
  PremiumSection,
  PremiumTableSkeleton,
} from "@/components/premium";
import { fileCenterListQuerySchema } from "@/lib/validations/file-center";
import {
  listFileCenter,
  listCustomersForFileFilter,
  listUploadersForFileFilter,
} from "@/lib/services/file-center-service";

export const metadata = { title: "Dosya Merkezi" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function FilesContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePermission("file:read");
  const canDownload = hasPermission(user, "file:download");
  const canDelete =
    hasPermission(user, "file:delete") &&
    (isSuperAdmin(user) || hasRole(user, "ADMIN"));

  const params = searchParams;
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    customerId:
      typeof params.customerId === "string" ? params.customerId : undefined,
    fileType:
      typeof params.fileType === "string" ? params.fileType : undefined,
    module: typeof params.module === "string" ? params.module : undefined,
    uploadedById:
      typeof params.uploadedById === "string"
        ? params.uploadedById
        : undefined,
    dateFrom:
      typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };
  const query = fileCenterListQuerySchema.parse(raw);

  const [list, customers, uploaders] = await Promise.all([
    listFileCenter(user, query),
    listCustomersForFileFilter(user),
    listUploadersForFileFilter(),
  ]);

  return (
    <FileCenterPageClient
      items={list.items}
      customers={customers}
      uploaders={uploaders}
      shown={list.shown}
      hasMore={list.hasMore}
      nextCursor={list.nextCursor}
      canDownload={canDownload}
      canDelete={canDelete}
    />
  );
}

export default async function FilesPage({ searchParams }: Props) {
  await requirePermission("file:read");

  return (
    <>
      <Header
        title="Dosya Merkezi"
        description="Kurumsal doküman arşivi"
      />
      <PageShell>
        <PremiumPageContainer>
          <Suspense
            fallback={
              <PremiumSection>
                <PremiumTableSkeleton rows={6} cols={7} />
              </PremiumSection>
            }
          >
            <FilesContent searchParams={await searchParams} />
          </Suspense>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

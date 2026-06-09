import Link from "next/link";
import {
  PremiumTabNav,
  PremiumTabPanel,
} from "@/components/premium/premium-tab-nav";
import { CustomerTimeline } from "@/components/customers/customer-timeline";
import { format } from "@/lib/utils/date-format";
import type { ComponentProps } from "react";
import { EntityFileList } from "@/components/files/entity-file-list";
import { EntityFileUpload } from "@/components/files/entity-file-upload";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import { uploadVisitDocumentAction } from "@/actions/visits/upload-document";

const TABS = [
  { id: "general", label: "Genel Bilgiler" },
  { id: "files", label: "Dosyalar" },
  { id: "activity", label: "Aktivite Geçmişi" },
  { id: "audit", label: "Audit Geçmişi" },
] as const;

export type VisitTabId = (typeof TABS)[number]["id"];

export function parseVisitTab(tab?: string): VisitTabId {
  if (tab && TABS.some((t) => t.id === tab)) return tab as VisitTabId;
  return "general";
}

type VisitDetail = {
  id: string;
  visitNo: string;
  visitDate: Date;
  description: string;
  result: string | null;
  nextVisitDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: { id: string; legalName: string; tradeName: string | null };
  contract: { id: string; number: string; title: string } | null;
  serviceTicket: { id: string; ticketNo: string; title: string } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: { firstName: string; lastName: string } | null;
};

type Props = {
  visit: VisitDetail;
  activeTab: VisitTabId;
  activities: ComponentProps<typeof CustomerTimeline>["activities"];
  files: FileCenterItem[];
  canFileRead: boolean;
  canFileDownload: boolean;
  canDocumentUpload: boolean;
  auditLogs: Array<{
    id: string;
    action: string;
    changes: unknown;
    createdAt: Date;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
};

export function VisitDetailTabs({
  visit,
  activeTab,
  activities,
  auditLogs,
  files,
  canFileRead,
  canFileDownload,
  canDocumentUpload,
}: Props) {
  const boundUpload = uploadVisitDocumentAction.bind(null, visit.id);
  const base = `/visits/${visit.id}`;

  return (
    <div>
      <PremiumTabNav tabs={TABS} activeTab={activeTab} baseHref={base} />
      <PremiumTabPanel>
        {activeTab === "general" && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Müşteri</dt>
              <dd>
                <Link
                  href={`/customers/${visit.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {visit.customer.legalName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Personel</dt>
              <dd>
                {visit.user.firstName} {visit.user.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ziyaret tarihi</dt>
              <dd>{format(visit.visitDate, "date")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sonraki ziyaret</dt>
              <dd>
                {visit.nextVisitDate
                  ? format(visit.nextVisitDate, "date")
                  : "—"}
              </dd>
            </div>
            {visit.contract ? (
              <div>
                <dt className="text-muted-foreground">Sözleşme</dt>
                <dd>
                  <Link
                    href={`/contracts/${visit.contract.id}`}
                    className="font-mono hover:underline"
                  >
                    {visit.contract.number}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    — {visit.contract.title}
                  </span>
                </dd>
              </div>
            ) : null}
            {visit.serviceTicket ? (
              <div>
                <dt className="text-muted-foreground">Servis talebi</dt>
                <dd>
                  <Link
                    href={`/service-tickets/${visit.serviceTicket.id}`}
                    className="font-mono hover:underline"
                  >
                    {visit.serviceTicket.ticketNo}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    — {visit.serviceTicket.title}
                  </span>
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Açıklama</dt>
              <dd className="whitespace-pre-wrap">{visit.description}</dd>
            </div>
            {visit.result ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Sonuç</dt>
                <dd className="whitespace-pre-wrap">{visit.result}</dd>
              </div>
            ) : null}
          </dl>
        )}
        {activeTab === "files" && (
          <div className="space-y-4">
            {canDocumentUpload ? (
              <EntityFileUpload onUpload={boundUpload} />
            ) : null}
            {!canFileRead ? (
              <p className="text-sm text-muted-foreground">
                Görüntüleme yetkisi yok.
              </p>
            ) : (
              <EntityFileList
                items={files}
                canDownload={canFileDownload}
                emptyMessage="Bu ziyarete bağlı dosya yok."
              />
            )}
          </div>
        )}
        {activeTab === "activity" && (
          <CustomerTimeline activities={activities} />
        )}
        {activeTab === "audit" && (
          <>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kayıt yok.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {auditLogs.map((log) => (
                  <li key={log.id} className="p-4 text-sm">
                    <p className="font-medium">
                      {log.action} · {format(log.createdAt, "datetime")}
                    </p>
                    <p className="text-muted-foreground">
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : "Sistem"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PremiumTabPanel>
    </div>
  );
}

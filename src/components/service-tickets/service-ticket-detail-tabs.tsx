"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  PremiumTabNav,
  PremiumTabPanel,
} from "@/components/premium/premium-tab-nav";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { PremiumSection } from "@/components/premium/premium-section";
import { CustomerTimeline } from "@/components/customers/customer-timeline";
import { format } from "@/lib/utils/date-format";
import { SERVICE_PRIORITY_LABELS } from "@/lib/services/service-ticket-state-machine";
import type { ComponentProps } from "react";
import { EntityFileList } from "@/components/files/entity-file-list";
import { EntityFileUpload } from "@/components/files/entity-file-upload";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import { uploadServiceTicketDocumentAction } from "@/actions/service-tickets/upload-document";
import {
  SERVICE_TICKET_DETAIL_TABS,
  type ServiceTicketTabId,
} from "@/lib/service-tickets/service-ticket-tabs";

export type { ServiceTicketTabId };

type TicketDetail = {
  id: string;
  ticketNo: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  openedAt: Date;
  closedAt: Date | null;
  customer: { id: string; legalName: string; tradeName: string | null };
  contract: { id: string; number: string; title: string } | null;
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdBy: { firstName: string; lastName: string } | null;
};

type VisitRow = {
  id: string;
  visitNo: string;
  visitDate: Date;
  result: string | null;
  nextVisitDate: Date | null;
  user: { firstName: string; lastName: string };
};

type AuditLogRow = {
  id: string;
  action: string;
  changes: unknown;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type Props = {
  ticket: TicketDetail;
  activeTab: ServiceTicketTabId;
  activities: ComponentProps<typeof CustomerTimeline>["activities"];
  auditLogs: AuditLogRow[];
  visits: VisitRow[];
  canVisitRead: boolean;
  canVisitWrite: boolean;
  files: FileCenterItem[];
  canFileRead: boolean;
  canFileDownload: boolean;
  canDocumentUpload: boolean;
};

export function ServiceTicketDetailTabs({
  ticket,
  activeTab,
  activities,
  auditLogs,
  visits,
  canVisitRead,
  canVisitWrite,
  files,
  canFileRead,
  canFileDownload,
  canDocumentUpload,
}: Props) {
  const boundUpload = uploadServiceTicketDocumentAction.bind(null, ticket.id);
  const base = `/service-tickets/${ticket.id}`;

  const visitColumns = useMemo<ColumnDef<VisitRow>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => (
          <Link
            href={`/visits/${row.original.id}`}
            className="font-mono text-sm hover:underline"
          >
            {row.original.visitNo}
          </Link>
        ),
      },
      {
        id: "visitDate",
        header: "Tarih",
        cell: ({ row }) => format(row.original.visitDate, "date"),
      },
      {
        id: "user",
        header: "Personel",
        cell: ({ row }) =>
          `${row.original.user.firstName} ${row.original.user.lastName}`,
      },
      {
        id: "result",
        header: "Sonuç",
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">
            {row.original.result ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  const auditColumns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        id: "audit",
        header: "Kayıt",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">
              {row.original.action} · {format(row.original.createdAt, "datetime")}
            </p>
            <p className="text-muted-foreground">
              {row.original.user
                ? `${row.original.user.firstName} ${row.original.user.lastName}`
                : "Sistem"}
            </p>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PremiumTabNav tabs={SERVICE_TICKET_DETAIL_TABS} activeTab={activeTab} baseHref={base} />
      <PremiumTabPanel>
        {activeTab === "general" && (
          <PremiumSection>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Müşteri</dt>
              <dd>
                <Link
                  href={`/customers/${ticket.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {ticket.customer.legalName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Öncelik</dt>
              <dd>{SERVICE_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</dd>
            </div>
            {ticket.contract ? (
              <div>
                <dt className="text-muted-foreground">Sözleşme</dt>
                <dd>
                  <Link
                    href={`/contracts/${ticket.contract.id}`}
                    className="font-mono hover:underline"
                  >
                    {ticket.contract.number}
                  </Link>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Atanan</dt>
              <dd>
                {ticket.assignedUser
                  ? `${ticket.assignedUser.firstName} ${ticket.assignedUser.lastName}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Açılış</dt>
              <dd>{format(ticket.openedAt, "datetime")}</dd>
            </div>
            {ticket.closedAt ? (
              <div>
                <dt className="text-muted-foreground">Kapanış</dt>
                <dd>{format(ticket.closedAt, "datetime")}</dd>
              </div>
            ) : null}
            {ticket.description ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Açıklama</dt>
                <dd className="whitespace-pre-wrap">{ticket.description}</dd>
              </div>
            ) : null}
          </dl>
          </PremiumSection>
        )}
        {activeTab === "visits" && (
          <PremiumSection>
            {canVisitWrite ? (
              <Link
                href={`/visits/new?customerId=${ticket.customer.id}&serviceTicketId=${ticket.id}`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Yeni saha ziyareti
              </Link>
            ) : null}
            {!canVisitRead ? (
              <PremiumEmptyState
                title="Erişim Yok"
                description="Görüntüleme yetkisi yok."
              />
            ) : visits.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Bu talebe bağlı ziyaret yok."
              />
            ) : (
              <PremiumDataTable
                data={visits}
                columns={visitColumns}
                compact
              />
            )}
          </PremiumSection>
        )}
        {activeTab === "files" && (
          <PremiumSection>
            {canDocumentUpload ? (
              <EntityFileUpload
                label="Dosya yükle"
                onUpload={boundUpload}
              />
            ) : null}
            {!canFileRead ? (
              <PremiumEmptyState
                title="Erişim Yok"
                description="Görüntüleme yetkisi yok."
              />
            ) : (
              <EntityFileList
                items={files}
                canDownload={canFileDownload}
                emptyMessage="Bu talebe bağlı dosya yok."
              />
            )}
          </PremiumSection>
        )}
        {activeTab === "activity" && (
          <PremiumSection>
            <CustomerTimeline activities={activities} />
          </PremiumSection>
        )}
        {activeTab === "audit" && (
          <PremiumSection>
            {auditLogs.length === 0 ? (
              <PremiumEmptyState
                title="Kayıt Bulunamadı"
                description="Kayıt yok."
              />
            ) : (
              <PremiumDataTable
                data={auditLogs}
                columns={auditColumns}
                compact
              />
            )}
          </PremiumSection>
        )}
      </PremiumTabPanel>
    </div>
  );
}

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
import {
  SERVICE_PRIORITY_LABELS,
  SERVICE_TYPE_LABELS,
  SYSTEM_TYPE_LABELS,
} from "@/lib/services/service-ticket-state-machine";
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
  workDone: string | null;
  techNotes: string | null;
  status: string;
  priority: string;
  serviceType: string;
  systemType: string | null;
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  location: string | null;
  inventoryNo: string | null;
  currency: string;
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  total: { toString(): string };
  openedAt: Date;
  closedAt: Date | null;
  customer: { id: string; legalName: string; tradeName: string | null; contacts: { fullName: string; phone: string | null; email: string | null }[] };
  contract: { id: string; number: string; title: string } | null;
  assignedUser: { id: string; firstName: string; lastName: string; email: string } | null;
  lineItems: { id: string; sortOrder: number; description: string; quantity: { toString(): string }; unit: string; unitPrice: { toString(): string }; taxRate: { toString(): string }; lineTotal: { toString(): string } }[];
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
          <div className="space-y-6">
            {/* ── Servis Bilgileri ── */}
            <PremiumSection title="Servis Bilgileri">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Servis Türü</dt><dd>{SERVICE_TYPE_LABELS[ticket.serviceType] ?? ticket.serviceType}</dd></div>
                <div><dt className="text-muted-foreground">Öncelik</dt><dd>{SERVICE_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</dd></div>
                <div><dt className="text-muted-foreground">Açılış</dt><dd>{format(ticket.openedAt, "datetime")}</dd></div>
                {ticket.closedAt && <div><dt className="text-muted-foreground">Kapanış</dt><dd>{format(ticket.closedAt, "datetime")}</dd></div>}
                <div><dt className="text-muted-foreground">Teknisyen</dt><dd>{ticket.assignedUser ? `${ticket.assignedUser.firstName} ${ticket.assignedUser.lastName}` : "—"}</dd></div>
                {ticket.contract && (
                  <div><dt className="text-muted-foreground">Sözleşme</dt><dd><Link href={`/contracts/${ticket.contract.id}`} className="font-mono hover:underline">{ticket.contract.number}</Link></dd></div>
                )}
              </dl>
            </PremiumSection>

            {/* ── Müşteri Bilgileri ── */}
            <PremiumSection title="Müşteri Bilgileri">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Firma</dt><dd><Link href={`/customers/${ticket.customer.id}`} className="font-medium hover:underline">{ticket.customer.legalName}</Link></dd></div>
                {ticket.customer.contacts[0]?.phone && <div><dt className="text-muted-foreground">Telefon</dt><dd>{ticket.customer.contacts[0].phone}</dd></div>}
                {ticket.customer.contacts[0]?.email && <div><dt className="text-muted-foreground">E-Posta</dt><dd>{ticket.customer.contacts[0].email}</dd></div>}
              </dl>
            </PremiumSection>

            {/* ── Sistem / Cihaz ── */}
            {(ticket.systemType || ticket.brand || ticket.model || ticket.serialNo || ticket.location) && (
              <PremiumSection title="Sistem / Cihaz Bilgileri">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {ticket.systemType && <div><dt className="text-muted-foreground">Sistem Türü</dt><dd>{SYSTEM_TYPE_LABELS[ticket.systemType] ?? ticket.systemType}</dd></div>}
                  {ticket.brand && <div><dt className="text-muted-foreground">Marka</dt><dd>{ticket.brand}</dd></div>}
                  {ticket.model && <div><dt className="text-muted-foreground">Model</dt><dd>{ticket.model}</dd></div>}
                  {ticket.serialNo && <div><dt className="text-muted-foreground">Seri No</dt><dd>{ticket.serialNo}</dd></div>}
                  {ticket.location && <div><dt className="text-muted-foreground">Lokasyon</dt><dd>{ticket.location}</dd></div>}
                  {ticket.inventoryNo && <div><dt className="text-muted-foreground">Envanter No</dt><dd>{ticket.inventoryNo}</dd></div>}
                </dl>
              </PremiumSection>
            )}

            {/* ── Talep / Arıza ── */}
            {ticket.description && (
              <PremiumSection title="Talep / Arıza Bildirimi">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </PremiumSection>
            )}

            {/* ── Yapılan İşlemler ── */}
            {ticket.workDone && (
              <PremiumSection title="Yapılan İşlemler">
                <p className="text-sm whitespace-pre-wrap">{ticket.workDone}</p>
              </PremiumSection>
            )}

            {/* ── Teknik Notlar ── */}
            {ticket.techNotes && (
              <PremiumSection title="Teknik Notlar (Dahili)">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{ticket.techNotes}</p>
              </PremiumSection>
            )}

            {/* ── Kalemler ── */}
            {ticket.lineItems.length > 0 && (
              <PremiumSection title="Kullanılan Malzeme ve Hizmetler">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2">Açıklama</th>
                      <th className="text-right py-2 w-16">Miktar</th>
                      <th className="text-center py-2 w-16">Birim</th>
                      <th className="text-right py-2 w-24">Birim Fiyat</th>
                      <th className="text-right py-2 w-16">KDV%</th>
                      <th className="text-right py-2 w-24">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticket.lineItems.map((li) => (
                      <tr key={li.id} className="border-b last:border-0">
                        <td className="py-2">{li.description}</td>
                        <td className="py-2 text-right tabular-nums">{Number(li.quantity.toString()).toLocaleString("tr-TR")}</td>
                        <td className="py-2 text-center">{li.unit}</td>
                        <td className="py-2 text-right tabular-nums">{Number(li.unitPrice.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 text-right">%{Number(li.taxRate.toString())}</td>
                        <td className="py-2 text-right font-medium tabular-nums">{Number(li.lineTotal.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                  <div className="flex gap-8 text-muted-foreground">
                    <span>Ara Toplam:</span>
                    <span className="tabular-nums w-28 text-right">{Number(ticket.subtotal.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {ticket.currency}</span>
                  </div>
                  <div className="flex gap-8 text-muted-foreground">
                    <span>KDV:</span>
                    <span className="tabular-nums w-28 text-right">{Number(ticket.taxTotal.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {ticket.currency}</span>
                  </div>
                  <div className="flex gap-8 font-semibold border-t pt-1">
                    <span>Genel Toplam:</span>
                    <span className="tabular-nums w-28 text-right">{Number(ticket.total.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {ticket.currency}</span>
                  </div>
                </div>
              </PremiumSection>
            )}
          </div>
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

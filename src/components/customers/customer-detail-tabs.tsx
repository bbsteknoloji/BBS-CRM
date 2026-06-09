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
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerHealthBadge } from "./customer-health-badge";
import { ServiceTicketStatusBadge } from "@/components/service-tickets/service-ticket-status-badge";
import type { CustomerHealthStatus, ServiceTicketStatus } from "@prisma/client";
import { CustomerContactsPanel } from "./customer-contacts-panel";
import { CustomerDevicesPanel } from "./customer-devices-panel";
import { CustomerTasksPanel } from "./customer-tasks-panel";
import { CustomerTimeline } from "./customer-timeline";
import { format } from "@/lib/utils/date-format";
import type { CustomerStatus } from "@prisma/client";
import type { ComponentProps } from "react";
import { EntityFileList } from "@/components/files/entity-file-list";
import type { FileCenterItem } from "@/lib/services/file-center-types";
import type { CustomerDeviceRow } from "@/lib/services/customer-device-service";

import type { CustomerTabId } from "@/lib/customers/customer-tabs";
import { CUSTOMER_DETAIL_TABS } from "@/lib/customers/customer-tabs";

type Detail = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  website: string | null;
  status: CustomerStatus;
  healthStatus?: CustomerHealthStatus | null;
  notes: string | null;
  createdAt: Date;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  addresses: {
    line1: string;
    line2: string | null;
    district: string | null;
    city: string;
    postalCode: string | null;
  }[];
  contacts: ComponentProps<typeof CustomerContactsPanel>["contacts"];
};

type ServiceTicketRow = {
  id: string;
  ticketNo: string;
  title: string;
  status: ServiceTicketStatus;
  priority: string;
  openedAt: Date;
};

type VisitRow = {
  id: string;
  visitNo: string;
  visitDate: Date;
  result: string | null;
  nextVisitDate: Date | null;
  user: { firstName: string; lastName: string };
};

type QuoteRow = {
  id: string;
  number: string;
  title: string;
  status: string;
};

type ContractRow = {
  id: string;
  number: string;
  title: string;
  status: string;
};

type Props = {
  customer: Detail;
  activeTab: CustomerTabId;
  canWrite: boolean;
  activities: ComponentProps<typeof CustomerTimeline>["activities"];
  tasks: ComponentProps<typeof CustomerTasksPanel>["tasks"];
  users: { id: string; name: string }[];
  quotes: QuoteRow[];
  contracts: ContractRow[];
  serviceTickets: ServiceTicketRow[];
  canServiceRead: boolean;
  canServiceWrite: boolean;
  visits: VisitRow[];
  canVisitRead: boolean;
  canVisitWrite: boolean;
  customerFiles: FileCenterItem[];
  canFileRead: boolean;
  canFileDownload: boolean;
  devices: CustomerDeviceRow[];
};

export function CustomerDetailTabs({
  customer,
  activeTab,
  canWrite,
  activities,
  tasks,
  users,
  quotes,
  contracts,
  serviceTickets,
  canServiceRead,
  canServiceWrite,
  visits,
  canVisitRead,
  canVisitWrite,
  customerFiles,
  canFileRead,
  canFileDownload,
  devices,
}: Props) {
  const addr = customer.addresses[0];
  const base = `/customers/${customer.id}`;

  const serviceTicketColumns = useMemo<ColumnDef<ServiceTicketRow>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => (
          <Link
            href={`/service-tickets/${row.original.id}`}
            className="font-mono text-sm hover:underline"
          >
            {row.original.ticketNo}
          </Link>
        ),
      },
      {
        id: "title",
        header: "Başlık",
        cell: ({ row }) => row.original.title,
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => (
          <ServiceTicketStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "openedAt",
        header: "Açılış",
        cell: ({ row }) => format(row.original.openedAt, "short"),
      },
    ],
    []
  );

  const visitColumns = useMemo<ColumnDef<VisitRow>[]>(
    () => [
      {
        id: "date",
        header: "Tarih",
        cell: ({ row }) => (
          <>
            <Link
              href={`/visits/${row.original.id}`}
              className="hover:underline"
            >
              {format(row.original.visitDate, "date")}
            </Link>
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {row.original.visitNo}
            </span>
          </>
        ),
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
      {
        id: "nextVisitDate",
        header: "Sonraki ziyaret",
        cell: ({ row }) =>
          row.original.nextVisitDate
            ? format(row.original.nextVisitDate, "date")
            : "—",
      },
    ],
    []
  );

  const quoteColumns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      {
        id: "number",
        header: "No",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.number}</span>
        ),
      },
      {
        id: "title",
        header: "Başlık",
        cell: ({ row }) => row.original.title,
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => row.original.status,
      },
    ],
    []
  );

  const contractColumns = useMemo<ColumnDef<ContractRow>[]>(
    () => [
      {
        id: "number",
        header: "No",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.number}</span>
        ),
      },
      {
        id: "title",
        header: "Başlık",
        cell: ({ row }) => row.original.title,
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => row.original.status,
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <PremiumTabNav tabs={CUSTOMER_DETAIL_TABS} activeTab={activeTab} baseHref={base} />

      <PremiumTabPanel>
        {activeTab === "general" && (
          <PremiumSection>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Firma adı</dt>
              <dd className="font-medium">{customer.legalName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ticari ünvan</dt>
              <dd>{customer.tradeName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Vergi no</dt>
              <dd className="font-mono">{customer.taxNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Vergi dairesi</dt>
              <dd>{customer.taxOffice ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Durum</dt>
              <dd>
                <CustomerStatusBadge status={customer.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sağlık skoru</dt>
              <dd>
                <CustomerHealthBadge status={customer.healthStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sorumlu</dt>
              <dd>
                {customer.assignedTo
                  ? `${customer.assignedTo.firstName} ${customer.assignedTo.lastName}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Web</dt>
              <dd>
                {customer.website ? (
                  <a
                    href={customer.website}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {customer.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Kayıt tarihi</dt>
              <dd>{format(customer.createdAt, "date")}</dd>
            </div>
            {addr ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Adres</dt>
                <dd>
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  <br />
                  {[addr.district, addr.city, addr.postalCode]
                    .filter(Boolean)
                    .join(" / ")}
                </dd>
              </div>
            ) : null}
            {customer.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notlar</dt>
                <dd className="whitespace-pre-wrap text-sm">
                  {customer.notes}
                </dd>
              </div>
            ) : null}
          </dl>
          </PremiumSection>
        )}

        {activeTab === "contacts" && (
          <PremiumSection>
          <CustomerContactsPanel
            customerId={customer.id}
            contacts={customer.contacts}
            canWrite={canWrite}
          />
          </PremiumSection>
        )}

        {activeTab === "devices" && (
          <PremiumSection>
            <CustomerDevicesPanel
              customerId={customer.id}
              devices={devices}
              canWrite={canWrite}
            />
          </PremiumSection>
        )}

        {activeTab === "services" && (
          <PremiumSection>
            {canServiceWrite ? (
              <Link
                href={`/service-tickets/new?customerId=${customer.id}`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Yeni servis talebi
              </Link>
            ) : null}
            {!canServiceRead ? (
              <PremiumEmptyState
                title="Erişim Yok"
                description="Görüntüleme yetkisi yok."
              />
            ) : serviceTickets.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Servis talebi yok."
              />
            ) : (
              <PremiumDataTable
                data={serviceTickets}
                columns={serviceTicketColumns}
                compact
              />
            )}
          </PremiumSection>
        )}

        {activeTab === "visits" && (
          <PremiumSection>
            {canVisitWrite ? (
              <Link
                href={`/visits/new?customerId=${customer.id}`}
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
                description="Saha ziyareti yok."
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

        {activeTab === "tasks" && (
          <PremiumSection>
          <CustomerTasksPanel
            customerId={customer.id}
            tasks={tasks}
            users={users}
            canWrite={canWrite}
            defaultAssigneeId={
              customer.assignedTo?.id ?? users[0]?.id ?? ""
            }
          />
          </PremiumSection>
        )}

        {activeTab === "activity" && (
          <PremiumSection>
            <CustomerTimeline activities={activities} />
          </PremiumSection>
        )}

        {activeTab === "quotes" && (
          <PremiumSection>
            {quotes.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Bu müşteriye ait teklif yok."
              />
            ) : (
              <PremiumDataTable
                data={quotes}
                columns={quoteColumns}
                compact
              />
            )}
          </PremiumSection>
        )}

        {activeTab === "contracts" && (
          <PremiumSection>
            {contracts.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Bu müşteriye ait sözleşme yok."
              />
            ) : (
              <PremiumDataTable
                data={contracts}
                columns={contractColumns}
                compact
              />
            )}
          </PremiumSection>
        )}

        {activeTab === "files" && (
          <PremiumSection>
            {!canFileRead ? (
              <PremiumEmptyState
                title="Erişim Yok"
                description="Görüntüleme yetkisi yok."
              />
            ) : (
              <EntityFileList
                items={customerFiles}
                canDownload={canFileDownload}
                emptyMessage="Bu müşteriye ait dosya yok."
              />
            )}
          </PremiumSection>
        )}
      </PremiumTabPanel>
    </div>
  );
}

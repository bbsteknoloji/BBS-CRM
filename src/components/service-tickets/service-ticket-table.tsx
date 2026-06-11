"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { ServiceTicketStatus, ServiceType, TaskPriority } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { ServiceTicketStatusBadge } from "./service-ticket-status-badge";
import {
  SERVICE_PRIORITY_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/services/service-ticket-state-machine";
import { format } from "@/lib/utils/date-format";
import type { Decimal } from "@prisma/client/runtime/library";

export type ServiceTicketListRow = {
  id: string;
  ticketNo: string;
  title: string;
  status: ServiceTicketStatus;
  priority: TaskPriority;
  serviceType: ServiceType;
  total: Decimal;
  currency: string;
  openedAt: Date;
  customer: { id: string; legalName: string };
  assignedUser: { id: string; firstName: string; lastName: string } | null;
};

const columns: ColumnDef<ServiceTicketListRow>[] = [
  {
    accessorKey: "ticketNo",
    header: "Servis No",
    cell: ({ row }) => (
      <Link
        href={`/service-tickets/${row.original.id}`}
        className="font-mono text-sm font-medium hover:underline"
      >
        {row.original.ticketNo}
      </Link>
    ),
  },
  {
    accessorKey: "openedAt",
    header: "Tarih",
    cell: ({ row }) => format(row.original.openedAt, "short"),
  },
  {
    accessorKey: "title",
    header: "Başlık / Firma",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">{row.original.customer.legalName}</p>
      </div>
    ),
  },
  {
    accessorKey: "serviceType",
    header: "Servis Türü",
    cell: ({ row }) => SERVICE_TYPE_LABELS[row.original.serviceType] ?? row.original.serviceType,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => <ServiceTicketStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "priority",
    header: "Öncelik",
    cell: ({ row }) => SERVICE_PRIORITY_LABELS[row.original.priority] ?? row.original.priority,
  },
  {
    id: "assignee",
    header: "Teknisyen",
    cell: ({ row }) =>
      row.original.assignedUser
        ? `${row.original.assignedUser.firstName} ${row.original.assignedUser.lastName}`
        : "—",
  },
  {
    id: "total",
    header: "Toplam",
    cell: ({ row }) => {
      const n = Number(row.original.total.toString());
      if (!n) return "—";
      const sym = row.original.currency === "USD" ? "$" : row.original.currency === "EUR" ? "€" : "₺";
      return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(n)} ${sym}`;
    },
  },
];

export function ServiceTicketTable({ data }: { data: ServiceTicketListRow[] }) {
  return (
    <>
      {/* Mobil kart görünümü */}
      <div className="space-y-2 sm:hidden">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Kayıt bulunamadı.
          </p>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-hover rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/service-tickets/${item.id}`}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {item.ticketNo}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(item.openedAt, "short")}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.customer.legalName}
                  </p>
                </div>
                <ServiceTicketStatusBadge status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Tür</span>
                <span>{SERVICE_TYPE_LABELS[item.serviceType] ?? item.serviceType}</span>
                <span className="text-muted-foreground">Öncelik</span>
                <span>{SERVICE_PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                {item.assignedUser && (
                  <>
                    <span className="text-muted-foreground">Teknisyen</span>
                    <span>
                      {item.assignedUser.firstName} {item.assignedUser.lastName}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Masaüstü tablo görünümü */}
      <div className="hidden sm:block">
        <PremiumDataTable data={data} columns={columns} />
      </div>
    </>
  );
}

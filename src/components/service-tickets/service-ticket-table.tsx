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
  return <PremiumDataTable data={data} columns={columns} />;
}

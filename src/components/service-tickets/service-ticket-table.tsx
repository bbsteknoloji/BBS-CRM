"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { ServiceTicketStatus, TaskPriority } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { ServiceTicketStatusBadge } from "./service-ticket-status-badge";
import { SERVICE_PRIORITY_LABELS } from "@/lib/services/service-ticket-state-machine";
import { format } from "@/lib/utils/date-format";

export type ServiceTicketListRow = {
  id: string;
  ticketNo: string;
  title: string;
  status: ServiceTicketStatus;
  priority: TaskPriority;
  openedAt: Date;
  customer: { id: string; legalName: string };
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

const columns: ColumnDef<ServiceTicketListRow>[] = [
  {
    accessorKey: "ticketNo",
    header: "No",
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
    accessorKey: "title",
    header: "Başlık",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.customer.legalName}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => (
      <ServiceTicketStatusBadge status={row.original.status} />
    ),
  },
  {
    accessorKey: "priority",
    header: "Öncelik",
    cell: ({ row }) => SERVICE_PRIORITY_LABELS[row.original.priority],
  },
  {
    id: "assignee",
    header: "Atanan",
    cell: ({ row }) =>
      row.original.assignedUser
        ? `${row.original.assignedUser.firstName} ${row.original.assignedUser.lastName}`
        : "—",
  },
  {
    accessorKey: "openedAt",
    header: "Açılış",
    cell: ({ row }) => format(row.original.openedAt, "short"),
  },
];

export function ServiceTicketTable({ data }: { data: ServiceTicketListRow[] }) {
  return <PremiumDataTable data={data} columns={columns} />;
}

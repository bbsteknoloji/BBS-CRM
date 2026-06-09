"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/utils/date-format";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/utils/task-labels";

export type TaskListRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  startAt: Date | null;
  dueAt: Date | null;
  assignedTo: { id: string; firstName: string; lastName: string };
  customer: { id: string; legalName: string } | null;
};

function isOverdue(row: TaskListRow) {
  if (!row.dueAt) return false;
  if (row.status === "COMPLETED" || row.status === "CANCELLED") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return row.dueAt < today;
}

function priorityVariant(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "warning" as const;
    case "HIGH":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

const columns: ColumnDef<TaskListRow>[] = [
  {
    accessorKey: "title",
    header: "Başlık",
    cell: ({ row }) => (
      <Link
        href={`/tasks/${row.original.id}/edit`}
        className="font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "assignedTo",
    header: "Atanan",
    cell: ({ row }) =>
      `${row.original.assignedTo.firstName} ${row.original.assignedTo.lastName}`,
  },
  {
    id: "customer",
    header: "Müşteri",
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          href={`/customers/${row.original.customer.id}`}
          className="hover:underline"
        >
          {row.original.customer.legalName}
        </Link>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "priority",
    header: "Öncelik",
    cell: ({ row }) => (
      <Badge variant={priorityVariant(row.original.priority)}>
        {TASK_PRIORITY_LABELS[row.original.priority]}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => (
      <Badge variant="outline">{TASK_STATUS_LABELS[row.original.status]}</Badge>
    ),
  },
  {
    accessorKey: "dueAt",
    header: "Bitiş",
    cell: ({ row }) => (
      <span
        className={
          isOverdue(row.original) ? "font-medium text-destructive" : ""
        }
      >
        {row.original.dueAt ? format(row.original.dueAt, "date") : "—"}
        {isOverdue(row.original) ? " · Gecikmiş" : ""}
      </span>
    ),
  },
];

export function TaskTable({ data }: { data: TaskListRow[] }) {
  return <PremiumDataTable data={data} columns={columns} />;
}

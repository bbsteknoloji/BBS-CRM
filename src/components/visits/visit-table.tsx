"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { format } from "@/lib/utils/date-format";

export type VisitListRow = {
  id: string;
  visitNo: string;
  visitDate: Date;
  result: string | null;
  nextVisitDate: Date | null;
  customer: { id: string; legalName: string };
  user: { id: string; firstName: string; lastName: string };
};

const columns: ColumnDef<VisitListRow>[] = [
  {
    accessorKey: "visitNo",
    header: "No",
    cell: ({ row }) => (
      <Link
        href={`/visits/${row.original.id}`}
        className="font-mono text-sm font-medium hover:underline"
      >
        {row.original.visitNo}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Müşteri",
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer.id}`}
        className="hover:underline"
      >
        {row.original.customer.legalName}
      </Link>
    ),
  },
  {
    accessorKey: "visitDate",
    header: "Tarih",
    cell: ({ row }) => format(row.original.visitDate, "date"),
  },
  {
    id: "staff",
    header: "Personel",
    cell: ({ row }) =>
      `${row.original.user.firstName} ${row.original.user.lastName}`,
  },
  {
    accessorKey: "result",
    header: "Sonuç",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-xs text-sm">
        {row.original.result ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "nextVisitDate",
    header: "Sonraki ziyaret",
    cell: ({ row }) =>
      row.original.nextVisitDate
        ? format(row.original.nextVisitDate, "date")
        : "—",
  },
];

export function VisitTable({ data }: { data: VisitListRow[] }) {
  return <PremiumDataTable data={data} columns={columns} />;
}

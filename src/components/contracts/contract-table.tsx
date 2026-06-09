"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { ContractStatus, Currency } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { ContractStatusBadge } from "./contract-status-badge";
import { format } from "@/lib/utils/date-format";

export type ContractListRow = {
  id: string;
  number: string;
  title: string;
  status: ContractStatus;
  currency: Currency;
  total: number;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  customer: { id: string; legalName: string };
};

const columns: ColumnDef<ContractListRow>[] = [
  {
    accessorKey: "number",
    header: "No",
    cell: ({ row }) => (
      <Link
        href={`/contracts/${row.original.id}`}
        className="font-mono text-sm font-medium hover:underline"
      >
        {row.original.number}
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
      <ContractStatusBadge status={row.original.status} />
    ),
  },
  {
    id: "total",
    header: "Toplam",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {Number(row.original.total).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })}{" "}
        {row.original.currency}
      </span>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Başlangıç",
    cell: ({ row }) => format(row.original.startDate, "short"),
  },
  {
    accessorKey: "endDate",
    header: "Bitiş",
    cell: ({ row }) =>
      row.original.endDate ? format(row.original.endDate, "short") : "—",
  },
];

export function ContractTable({ data }: { data: ContractListRow[] }) {
  return <PremiumDataTable data={data} columns={columns} />;
}

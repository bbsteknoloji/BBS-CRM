"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { QuoteStatus, Currency } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { QuoteStatusBadge } from "./quote-status-badge";
import { formatMoneyWithCurrency } from "@/lib/utils/currency-format";
import { format } from "@/lib/utils/date-format";

export type QuoteListRow = {
  id: string;
  number: string;
  title: string;
  status: QuoteStatus;
  currency: Currency;
  total: number;
  validUntil: Date | null;
  version: number;
  createdAt: Date;
  customer: { id: string; legalName: string };
};

const columns: ColumnDef<QuoteListRow>[] = [
  {
    accessorKey: "number",
    header: "No",
    cell: ({ row }) => (
      <Link
        href={`/quotes/${row.original.id}`}
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
    cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
  },
  {
    id: "total",
    header: "Toplam",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMoneyWithCurrency(row.original.total, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "validUntil",
    header: "Geçerlilik",
    cell: ({ row }) =>
      row.original.validUntil
        ? format(row.original.validUntil, "short")
        : "—",
  },
  {
    accessorKey: "version",
    header: "Rev.",
    cell: ({ row }) => `v${row.original.version}`,
  },
];

export function QuoteTable({ data }: { data: QuoteListRow[] }) {
  return <PremiumDataTable data={data} columns={columns} />;
}

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
                  <Link
                    href={`/quotes/${item.id}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {item.number}
                  </Link>
                  <p className="text-sm font-medium truncate mt-0.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.customer.legalName}
                  </p>
                </div>
                <QuoteStatusBadge status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Toplam</span>
                <span className="tabular-nums">
                  {formatMoneyWithCurrency(item.total, item.currency)}
                </span>
                <span className="text-muted-foreground">Geçerlilik</span>
                <span>
                  {item.validUntil ? format(item.validUntil, "short") : "—"}
                </span>
                <span className="text-muted-foreground">Revizyon</span>
                <span>v{item.version}</span>
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

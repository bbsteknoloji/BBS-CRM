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
                    href={`/contracts/${item.id}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {item.number}
                  </Link>
                  <p className="text-sm font-medium truncate mt-0.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.customer.legalName}
                  </p>
                </div>
                <ContractStatusBadge status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Başlangıç</span>
                <span>{format(item.startDate, "short")}</span>
                <span className="text-muted-foreground">Bitiş</span>
                <span>{item.endDate ? format(item.endDate, "short") : "—"}</span>
                <span className="text-muted-foreground">Toplam</span>
                <span className="tabular-nums">
                  {Number(item.total).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {item.currency}
                </span>
                {item.autoRenew && (
                  <>
                    <span className="text-muted-foreground">Yenileme</span>
                    <span className="text-green-600 dark:text-green-400">Otomatik</span>
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

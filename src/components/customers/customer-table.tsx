"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import type { CustomerStatus } from "@prisma/client";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { CustomerStatusBadge } from "./customer-status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CustomerListItem = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  status: CustomerStatus;
  city: string | null;
  deviceCount: number;
  firstDeviceSerial: string | null;
  createdAt: Date;
};

function rowMuted(hasCity: boolean) {
  return !hasCity ? "text-muted-foreground" : undefined;
}

const columns: ColumnDef<CustomerListItem>[] = [
  {
    accessorKey: "legalName",
    header: "Firma",
    cell: ({ row }) => {
      const muted = rowMuted(Boolean(row.original.city?.trim()));
      return (
        <div className={cn(muted)}>
          <Link
            href={`/customers/${row.original.id}`}
            className={cn("font-medium hover:underline", muted && "text-muted-foreground")}
          >
            {row.original.legalName}
          </Link>
          {row.original.tradeName ? (
            <p className="text-xs text-muted-foreground">
              {row.original.tradeName}
            </p>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "taxNumber",
    header: "Vergi No",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-mono text-sm",
          rowMuted(Boolean(row.original.city?.trim()))
        )}
      >
        {row.original.taxNumber}
      </span>
    ),
  },
  {
    accessorKey: "taxOffice",
    header: "Vergi Dairesi",
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.original.taxOffice?.trim() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "city",
    header: "Şehir",
    cell: ({ row }) => {
      const city = row.original.city?.trim();
      return (
        <span className={city ? undefined : "text-muted-foreground"}>
          {city || "—"}
        </span>
      );
    },
  },
  {
    id: "devices",
    header: "Cihaz",
    cell: ({ row }) => {
      const { deviceCount, firstDeviceSerial } = row.original;
      if (deviceCount <= 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
          >
            {deviceCount} cihaz
          </Badge>
          {firstDeviceSerial ? (
            <span className="font-mono text-xs text-muted-foreground">
              SN:{firstDeviceSerial}
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => (
      <CustomerStatusBadge status={row.original.status} />
    ),
  },
];

type Props = {
  data: CustomerListItem[];
};

export function CustomerTable({ data }: Props) {
  return <PremiumDataTable data={data} columns={columns} />;
}

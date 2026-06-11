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
                    href={`/customers/${item.id}`}
                    className="font-medium hover:underline block truncate"
                  >
                    {item.legalName}
                  </Link>
                  {item.tradeName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.tradeName}
                    </p>
                  )}
                </div>
                <CustomerStatusBadge status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Şehir</span>
                <span>{item.city?.trim() || "—"}</span>
                <span className="text-muted-foreground">Vergi No</span>
                <span className="font-mono">{item.taxNumber || "—"}</span>
                {item.deviceCount > 0 && (
                  <>
                    <span className="text-muted-foreground">Cihaz</span>
                    <span>{item.deviceCount} cihaz</span>
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

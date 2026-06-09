"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PremiumDataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  className?: string;
  compact?: boolean;
  emptyMessage?: string;
};

export function PremiumDataTable<T>({
  data,
  columns,
  className,
  compact = false,
  emptyMessage = "Kayıt bulunamadı.",
}: PremiumDataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-lg border border-border/60",
        className
      )}
    >
      <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="border-border/60 hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={cn(compact && "h-9 px-3 text-xs")}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="premium-table-row border-border/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(compact && "px-3 py-2 text-sm")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

export function PremiumTableSkeleton({
  rows = 5,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel animate-pulse space-y-3 rounded-lg p-4",
        className
      )}
    >
      <div className="h-8 rounded bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-6 rounded bg-muted/70" />
          ))}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { Pencil, Check, X, ExternalLink } from "lucide-react";
import type { Currency } from "@prisma/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoneyWithCurrency } from "@/lib/utils/currency-format";
import { quickUpdateProductAction } from "@/actions/products/quick-update-product";

export type ProductListRow = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  currency: Currency;
  isActive: boolean;
};

type EditState = {
  sku: string;
  name: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
  currency: Currency;
  isActive: boolean;
};

function EditRow({
  row,
  onSave,
  onCancel,
}: {
  row: ProductListRow;
  onSave: (updated: Partial<ProductListRow>) => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState>({
    sku: row.sku,
    name: row.name,
    unit: row.unit,
    unitPrice: String(row.unitPrice),
    taxRate: String(row.taxRate),
    currency: row.currency,
    isActive: row.isActive,
  });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function set<K extends keyof EditState>(key: K, val: EditState[K]) {
    setEdit((s) => ({ ...s, [key]: val }));
  }

  function save() {
    startTransition(async () => {
      const payload = {
        sku: edit.sku,
        name: edit.name,
        unit: edit.unit,
        unitPrice: parseFloat(edit.unitPrice) || 0,
        taxRate: parseFloat(edit.taxRate) || 0,
        currency: edit.currency,
        isActive: edit.isActive,
      };
      const result = await quickUpdateProductAction(row.id, payload);
      if (result.success) {
        toast.success("Ürün güncellendi");
        onSave(payload);
      } else {
        toast.error(result.error ?? "Güncellenemedi");
      }
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && !e.shiftKey) save();
  }

  const inputCls = "h-8 text-sm";

  return (
    <TableRow className="bg-blue-50/20 dark:bg-blue-950/20">
      <TableCell>
        <Input
          className={`${inputCls} w-32 font-mono`}
          value={edit.sku}
          onChange={(e) => set("sku", e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </TableCell>
      <TableCell>
        <Input
          ref={nameRef}
          className={`${inputCls} min-w-[200px]`}
          value={edit.name}
          onChange={(e) => set("name", e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </TableCell>
      <TableCell>
        <Input
          className={`${inputCls} w-20`}
          value={edit.unit}
          onChange={(e) => set("unit", e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </TableCell>
      <TableCell>
        <Input
          className={`${inputCls} w-28 tabular-nums`}
          type="number"
          min={0}
          step="0.01"
          value={edit.unitPrice}
          onChange={(e) => set("unitPrice", e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </TableCell>
      <TableCell>
        <Input
          className={`${inputCls} w-16 tabular-nums`}
          type="number"
          min={0}
          max={100}
          step="1"
          value={edit.taxRate}
          onChange={(e) => set("taxRate", e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </TableCell>
      <TableCell>
        <select
          className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
          value={edit.currency}
          onChange={(e) => set("currency", e.target.value as Currency)}
          disabled={pending}
        >
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </TableCell>
      <TableCell>
        <select
          className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm"
          value={edit.isActive ? "true" : "false"}
          onChange={(e) => set("isActive", e.target.value === "true")}
          disabled={pending}
        >
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="h-7 w-7"
            onClick={save}
            disabled={pending}
            title="Kaydet (Enter)"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onCancel}
            disabled={pending}
            title="İptal (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DisplayRow({
  row,
  onEdit,
}: {
  row: ProductListRow;
  onEdit: () => void;
}) {
  return (
    <TableRow className="premium-table-row group border-border/40">
      <TableCell>
        <span className="font-mono text-sm font-medium">{row.sku}</span>
      </TableCell>
      <TableCell>
        <span className="font-medium" title={row.name}>
          {row.name}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{row.unit}</TableCell>
      <TableCell>
        <span className="tabular-nums">
          {formatMoneyWithCurrency(row.unitPrice, row.currency)}
        </span>
      </TableCell>
      <TableCell>
        <span className="tabular-nums text-muted-foreground">
          %{row.taxRate.toFixed(0)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{row.currency}</span>
      </TableCell>
      <TableCell>
        {row.isActive ? (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary">Pasif</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onEdit}
            title="Satırda düzenle"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            asChild
            title="Tam form"
          >
            <Link href={`/products/${row.id}/edit`}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductTable({ data }: { data: ProductListRow[] }) {
  const [rows, setRows] = useState<ProductListRow[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSaved(id: string, updated: Partial<ProductListRow>) {
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
    setEditingId(null);
  }

  return (
    <div className="glass-panel overflow-hidden rounded-lg border border-border/60">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Ürün Kodu</TableHead>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead>Satış Fiyatı</TableHead>
              <TableHead>KDV</TableHead>
              <TableHead>Döviz</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-[88px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) =>
                editingId === row.id ? (
                  <EditRow
                    key={row.id}
                    row={row}
                    onSave={(updated) => handleSaved(row.id, updated)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <DisplayRow
                    key={row.id}
                    row={row}
                    onEdit={() => setEditingId(row.id)}
                  />
                )
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

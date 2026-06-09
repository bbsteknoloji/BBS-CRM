"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTotals } from "@/lib/quotes/calculations";
import type { ContractFormInput } from "@/lib/validations/contract";

export type ProductOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
};

type Line = ContractFormInput["lineItems"][number];

const emptyLine = (): Line => ({
  productId: "",
  description: "",
  quantity: 1,
  unit: "adet",
  unitPrice: 0,
  taxRate: 20,
});

type Props = {
  initialItems?: Line[];
  products: ProductOption[];
  currency: string;
};

export function ContractLineItemsEditor({
  initialItems,
  products,
  currency,
}: Props) {
  const [lines, setLines] = useState<Line[]>(
    initialItems?.length ? initialItems : [emptyLine()]
  );

  const totals = useMemo(
    () =>
      calculateTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
        }))
      ),
    [lines]
  );

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  }

  function addFromProduct(productId: string, index: number) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(index, {
      productId: p.id,
      description: p.name,
      unit: p.unit,
      unitPrice: Number(p.unitPrice),
      taxRate: Number(p.taxRate),
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="lineItems"
        value={JSON.stringify(lines)}
        readOnly
      />
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-12"
          >
            <div className="sm:col-span-12">
              <label className="text-xs text-muted-foreground">Ürün</label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={line.productId ?? ""}
                onChange={(e) => addFromProduct(e.target.value, index)}
              >
                <option value="">Manuel / seçin</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="text-xs text-muted-foreground">Açıklama</label>
              <Input
                value={line.description}
                onChange={(e) =>
                  updateLine(index, { description: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Miktar</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(index, {
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-muted-foreground">Birim</label>
              <Input
                value={line.unit}
                onChange={(e) =>
                  updateLine(index, { unit: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">
                Birim fiyat
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) =>
                  updateLine(index, {
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-muted-foreground">KDV %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={line.taxRate}
                onChange={(e) =>
                  updateLine(index, {
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-end justify-between sm:col-span-2">
              <div>
                <p className="text-xs text-muted-foreground">Satır toplam</p>
                <p className="font-medium tabular-nums">
                  {totals.lines[index]?.lineTotal.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {currency}
                </p>
              </div>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setLines((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLines((prev) => [...prev, emptyLine()])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Kalem ekle
      </Button>
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ara toplam</span>
          <span className="tabular-nums font-medium">
            {totals.subtotal.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">KDV toplam</span>
          <span className="tabular-nums">
            {totals.taxTotal.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
          <span>Genel toplam</span>
          <span className="tabular-nums">
            {totals.total.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
        </div>
      </div>
    </div>
  );
}

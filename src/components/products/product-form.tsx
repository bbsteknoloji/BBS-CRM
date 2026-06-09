"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormInput } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/actions/types";
import { ProductDeleteButton } from "./product-delete-button";

type Props = {
  defaultValues?: Partial<ProductFormInput>;
  productId?: string;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
  canDelete?: boolean;
};

export function ProductForm({
  defaultValues,
  productId,
  submitLabel,
  onSubmit,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const d = defaultValues ?? {};

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result.success) {
        toast.success(productId ? "Ürün güncellendi" : "Ürün oluşturuldu");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(result.error);
        if (result.fieldErrors) {
          const first = Object.values(result.fieldErrors)[0]?.[0];
          if (first) toast.error(first);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">Ürün Kodu *</Label>
          <Input
            id="sku"
            name="sku"
            required
            defaultValue={d.sku}
            placeholder="UPS-10KVA"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Ürün Adı *</Label>
          <Input id="name" name="name" required defaultValue={d.name} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={d.description ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Birim *</Label>
          <Input
            id="unit"
            name="unit"
            required
            defaultValue={d.unit ?? "adet"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Satış Fiyatı *</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={d.unitPrice ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">KDV Oranı (%) *</Label>
          <Input
            id="taxRate"
            name="taxRate"
            type="number"
            min={0}
            max={100}
            step="1"
            required
            defaultValue={d.taxRate ?? 20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Para birimi</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={d.currency ?? "TRY"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="isActive">Durum</Label>
          <select
            id="isActive"
            name="isActive"
            defaultValue={d.isActive === false ? "false" : "true"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
        <input type="hidden" name="type" value={d.type ?? "SERVICE"} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          İptal
        </Button>
        {canDelete && productId ? (
          <ProductDeleteButton
            productId={productId}
            productName={d.name ?? "Ürün"}
          />
        ) : null}
      </div>
    </form>
  );
}

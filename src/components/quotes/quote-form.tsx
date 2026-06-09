"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuoteLineItemsEditor } from "./quote-line-items-editor";
import type { QuoteFormInput } from "@/lib/validations/quote";
import type { ActionResult } from "@/lib/actions/types";
import type { ProductOption } from "./quote-line-items-editor";

type CustomerOption = { id: string; legalName: string };

type Props = {
  customers: CustomerOption[];
  products: ProductOption[];
  defaultValues?: Partial<QuoteFormInput>;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

export function QuoteForm({
  customers,
  products,
  defaultValues,
  submitLabel,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">(
    (defaultValues?.currency as "TRY" | "USD" | "EUR") ?? "TRY"
  );
  const d = defaultValues ?? {};

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(fd);
      if (result.success) {
        toast.success("Teklif kaydedildi");
        router.push(`/quotes/${result.data.id}`);
      } else {
        toast.error(result.error);
        if (result.fieldErrors) {
          const first = Object.entries(result.fieldErrors)[0];
          if (first) {
            const [field, messages] = first;
            const label =
              field === "lineItems" || field.startsWith("lineItems.")
                ? "Kalemler"
                : field;
            toast.error(`${label}: ${messages[0]}`);
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={d.title}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">Müşteri *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            defaultValue={d.customerId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seçin</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Para birimi</Label>
          <input type="hidden" name="currency" value={currency} />
          <select
            id="currency"
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value as "TRY" | "USD" | "EUR")
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">Geçerlilik tarihi</Label>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={d.validUntil ?? ""}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Kalemler
        </h2>
        <QuoteLineItemsEditor
          initialItems={d.lineItems}
          products={products}
          currency={currency}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={d.notes} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Şartlar</Label>
          <Textarea id="terms" name="terms" rows={3} defaultValue={d.terms} />
        </div>
      </div>

      <div className="flex gap-3">
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
      </div>
    </form>
  );
}

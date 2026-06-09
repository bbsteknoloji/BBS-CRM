"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContractLineItemsEditor } from "./contract-line-items-editor";
import { ContractDeviceSelector } from "./contract-device-selector";
import type { ContractFormInput } from "@/lib/validations/contract";
import type { ActionResult } from "@/lib/actions/types";
import type { ProductOption } from "./contract-line-items-editor";

type CustomerOption = { id: string; legalName: string };
type QuoteOption = {
  id: string;
  number: string;
  title: string;
  customerId: string;
};

type Props = {
  customers: CustomerOption[];
  quotes: QuoteOption[];
  products: ProductOption[];
  defaultValues?: Partial<ContractFormInput> & { deviceIds?: string[] };
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

export function ContractForm({
  customers,
  quotes,
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
  const [customerId, setCustomerId] = useState(
    defaultValues?.customerId ?? ""
  );
  const [deviceIds, setDeviceIds] = useState<string[]>(
    defaultValues?.deviceIds ?? []
  );
  const handleDeviceChange = useCallback((ids: string[]) => {
    setDeviceIds(ids);
  }, []);
  const d = defaultValues ?? {};

  const today = new Date().toISOString().slice(0, 10);
  const [contractDate, setContractDate] = useState<string>(
    (d as { contractDate?: string }).contractDate ?? today
  );
  const [startDateLinked, setStartDateLinked] = useState(true);
  const [startDate, setStartDate] = useState<string>(
    d.startDate ?? today
  );

  // Checkbox işaretliyken startDate, contractDate ile senkron
  useEffect(() => {
    if (startDateLinked) setStartDate(contractDate);
  }, [startDateLinked, contractDate]);

  const filteredQuotes = customerId
    ? quotes.filter((q) => q.customerId === customerId)
    : quotes;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("deviceIds", JSON.stringify(deviceIds));
    startTransition(async () => {
      const result = await onSubmit(fd);
      if (result.success) {
        toast.success("Sözleşme kaydedildi");
        router.push(`/contracts/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      <p className="text-sm text-muted-foreground">
        Sözleşme numarası kayıt sırasında otomatik atanır (SOZ-{"{yıl}"}-{"{sıra}"}
        ).
      </p>
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
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setDeviceIds([]);
            }}
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
          <Label htmlFor="quoteId">Bağlı teklif</Label>
          <select
            id="quoteId"
            name="quoteId"
            defaultValue={d.quoteId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Yok</option>
            {filteredQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.number} — {q.title}
              </option>
            ))}
          </select>
        </div>
        {/* Sözleşme Tarihi */}
        <div className="space-y-2">
          <Label htmlFor="contractDate">Sözleşme tarihi *</Label>
          <Input
            id="contractDate"
            name="contractDate"
            type="date"
            required
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
          />
        </div>

        {/* Başlangıç Tarihi + Checkbox */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Başlangıç tarihi *</Label>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="startDateLinked"
              checked={startDateLinked}
              onChange={(e) => setStartDateLinked(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <label
              htmlFor="startDateLinked"
              className="text-xs text-muted-foreground font-normal cursor-pointer select-none"
            >
              Sözleşme tarihi ile aynı
            </label>
          </div>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={startDateLinked}
            className={startDateLinked ? "opacity-60" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Bitiş tarihi</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={d.endDate ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renewalNoticeDays">Yenileme süresi (gün) *</Label>
          <Input
            id="renewalNoticeDays"
            name="renewalNoticeDays"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={d.renewalNoticeDays ?? 30}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="autoRenew"
            name="autoRenew"
            defaultChecked={d.autoRenew}
            className="h-4 w-4 rounded border"
          />
          <Label htmlFor="autoRenew" className="font-normal">
            Otomatik yenileme
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Para birimi</Label>
          <select
            id="currency"
            name="currency"
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
      </section>

      <section className="rounded-lg border border-border p-4">
        <ContractDeviceSelector
          customerId={customerId}
          selectedIds={deviceIds}
          onChange={handleDeviceChange}
        />
        <input type="hidden" name="deviceIds" value={JSON.stringify(deviceIds)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sözleşme bedeli (kalemler)
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Sözleşme bedelini kalemler üzerinden girin. Tek kalem yeterlidir.
        </p>
        <ContractLineItemsEditor
          initialItems={d.lineItems}
          products={products}
          currency={currency}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Açıklama</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={d.notes} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="terms">Şartlar</Label>
          <Textarea id="terms" name="terms" rows={3} defaultValue={d.terms} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Fatura No</Label>
          <Input
            id="invoiceNumber"
            name="invoiceNumber"
            placeholder="Opsiyonel — örn: FTR-2026-00125"
            defaultValue={d.invoiceNumber ?? ""}
          />
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

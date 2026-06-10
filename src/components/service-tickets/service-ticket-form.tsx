"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceTicketFormInput } from "@/lib/validations/service-ticket";
import type { ActionResult } from "@/lib/actions/types";
import {
  SERVICE_PRIORITY_LABELS,
  SERVICE_TYPE_LABELS,
  SYSTEM_TYPE_LABELS,
} from "@/lib/services/service-ticket-state-machine";
import type { TaskPriority, ServiceType, SystemType } from "@prisma/client";

type CustomerOption = { id: string; legalName: string };
type ContractOption = { id: string; number: string; title: string };
type UserOption = { id: string; firstName: string; lastName: string };

type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
};

type Props = {
  customers: CustomerOption[];
  contracts: ContractOption[];
  users: UserOption[];
  defaultValues?: Partial<ServiceTicketFormInput> & { lineItems?: LineItem[] };
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function calcLineTotal(item: LineItem) {
  return item.quantity * item.unitPrice;
}

function calcTotals(items: LineItem[]) {
  const subtotal = items.reduce((s, i) => s + calcLineTotal(i), 0);
  const tax = items.reduce((s, i) => s + calcLineTotal(i) * (i.taxRate / 100), 0);
  return { subtotal, tax, total: subtotal + tax };
}

const SELECT_CLS = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ServiceTicketForm({
  customers,
  contracts,
  users,
  defaultValues,
  submitLabel,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const d = defaultValues ?? {};

  const [customerId, setCustomerId] = useState(d.customerId ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(d.lineItems ?? []);

  const filteredContracts = customerId
    ? contracts.filter(() => true) // contracts already filtered server-side
    : contracts;

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit: "adet", unitPrice: 0, taxRate: 20 },
    ]);
  }

  function removeLineItem(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [field]: typeof value === "number" ? value : value } : item
      )
    );
  }

  const { subtotal, tax, total } = calcTotals(lineItems);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lineItems", JSON.stringify(lineItems));
    startTransition(async () => {
      const result = await onSubmit(fd);
      if (result.success) {
        toast.success("Servis raporu kaydedildi");
        router.push(`/service-tickets/${result.data.id}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Bir hata oluştu");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      <p className="text-sm text-muted-foreground">
        Servis numarası kayıt sırasında otomatik atanır (SRV-{"{yıl}"}-{"{sıra}"}).
      </p>

      {/* ── Servis Bilgileri ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Servis Bilgileri
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input id="title" name="title" required defaultValue={d.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Servis Türü *</Label>
            <select id="serviceType" name="serviceType" defaultValue={d.serviceType ?? "FAULT_RESPONSE"} className={SELECT_CLS}>
              {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((k) => (
                <option key={k} value={k}>{SERVICE_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik</Label>
            <select id="priority" name="priority" defaultValue={d.priority ?? "MEDIUM"} className={SELECT_CLS}>
              {(Object.keys(SERVICE_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{SERVICE_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedUserId">Atanan Teknisyen</Label>
            <select id="assignedUserId" name="assignedUserId" defaultValue={d.assignedUserId ?? ""} className={SELECT_CLS}>
              <option value="">Atanmadı</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <select id="currency" name="currency" defaultValue={d.currency ?? "TRY"} className={SELECT_CLS}>
              <option value="TRY">TRY — Türk Lirası</option>
              <option value="USD">USD — Dolar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Müşteri Bilgileri ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Müşteri Bilgileri
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerId">Müşteri *</Label>
            <select
              id="customerId"
              name="customerId"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Seçin</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.legalName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractId">Bağlı Sözleşme</Label>
            <select id="contractId" name="contractId" defaultValue={d.contractId ?? ""} className={SELECT_CLS}>
              <option value="">Yok</option>
              {filteredContracts.map((c) => (
                <option key={c.id} value={c.id}>{c.number} — {c.title}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Sistem / Cihaz Bilgileri ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Sistem / Cihaz Bilgileri
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="systemType">Sistem Türü</Label>
            <select id="systemType" name="systemType" defaultValue={(d.systemType as string) ?? ""} className={SELECT_CLS}>
              <option value="">Seçin</option>
              {(Object.keys(SYSTEM_TYPE_LABELS) as SystemType[]).map((k) => (
                <option key={k} value={k}>{SYSTEM_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marka</Label>
            <Input id="brand" name="brand" defaultValue={d.brand ?? ""} placeholder="örn. Cisco, Mikrotik" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" defaultValue={d.model ?? ""} placeholder="örn. RB4011" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serialNo">Seri Numarası</Label>
            <Input id="serialNo" name="serialNo" defaultValue={d.serialNo ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lokasyon</Label>
            <Input id="location" name="location" defaultValue={d.location ?? ""} placeholder="örn. 2. Kat Sunucu Odası" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryNo">Envanter No</Label>
            <Input id="inventoryNo" name="inventoryNo" defaultValue={d.inventoryNo ?? ""} />
          </div>
        </div>
      </fieldset>

      {/* ── Talep / Arıza ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Müşteri Talebi / Arıza Bildirimi
        </legend>
        <Textarea id="description" name="description" rows={4} defaultValue={d.description ?? ""} placeholder="Müşteri tarafından bildirilen sorun veya talep..." />
      </fieldset>

      {/* ── Yapılan İşlem ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Yapılan İşlemler
        </legend>
        <Textarea id="workDone" name="workDone" rows={4} defaultValue={d.workDone ?? ""} placeholder="Konfigürasyon güncellendi, firmware güncellendi, kablo testleri yapıldı..." />
      </fieldset>

      {/* ── Teknik Notlar ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Teknik Notlar <span className="text-xs font-normal">(dahili — PDF&apos;de isteğe bağlı)</span>
        </legend>
        <Textarea id="techNotes" name="techNotes" rows={3} defaultValue={d.techNotes ?? ""} placeholder="Sadece yetkili kullanıcıların göreceği iç notlar..." />
      </fieldset>

      {/* ── Kalemler ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 w-full">
          Kullanılan Malzeme ve Hizmetler
        </legend>

        {lineItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Açıklama</th>
                  <th className="text-right pb-2 font-medium w-20">Miktar</th>
                  <th className="text-center pb-2 font-medium w-20">Birim</th>
                  <th className="text-right pb-2 font-medium w-28">Birim Fiyat</th>
                  <th className="text-right pb-2 font-medium w-20">KDV %</th>
                  <th className="text-right pb-2 font-medium w-28">Tutar</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(i, "description", e.target.value)}
                        placeholder="Açıklama"
                        required
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        value={item.quantity}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateLineItem(i, "unit", e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        value={item.taxRate}
                        min={0}
                        max={100}
                        onChange={(e) => updateLineItem(i, "taxRate", parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="py-2 pl-1 text-right font-medium tabular-nums">
                      {formatNumber(calcLineTotal(item))}
                    </td>
                    <td className="py-2 pl-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(i)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
          + Kalem Ekle
        </Button>

        {lineItems.length > 0 && (
          <div className="flex flex-col items-end gap-1 pt-2 text-sm">
            <div className="flex gap-8 text-muted-foreground">
              <span>Ara Toplam:</span>
              <span className="tabular-nums w-32 text-right">{formatNumber(subtotal)}</span>
            </div>
            <div className="flex gap-8 text-muted-foreground">
              <span>KDV:</span>
              <span className="tabular-nums w-32 text-right">{formatNumber(tax)}</span>
            </div>
            <div className="flex gap-8 font-semibold text-base border-t pt-1">
              <span>Genel Toplam:</span>
              <span className="tabular-nums w-32 text-right">{formatNumber(total)}</span>
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          İptal
        </Button>
      </div>
    </form>
  );
}

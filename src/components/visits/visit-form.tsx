"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { VisitFormInput } from "@/lib/validations/visit";
import type { ActionResult } from "@/lib/actions/types";

type CustomerOption = { id: string; legalName: string };
type ContractOption = { id: string; number: string; title: string };
type TicketOption = {
  id: string;
  ticketNo: string;
  title: string;
  contractId: string | null;
};
type UserOption = { id: string; firstName: string; lastName: string };

type Props = {
  customers: CustomerOption[];
  contracts: ContractOption[];
  serviceTickets: TicketOption[];
  users: UserOption[];
  defaultValues?: Partial<VisitFormInput>;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

function toDateInputValue(d?: string | Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function VisitForm({
  customers,
  contracts,
  serviceTickets,
  users,
  defaultValues,
  submitLabel,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState(
    defaultValues?.customerId ?? ""
  );
  const d = defaultValues ?? {};

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(fd);
      if (result.success) {
        toast.success("Saha ziyareti kaydedildi");
        router.push(`/visits/${result.data.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onCustomerChange(nextId: string) {
    setCustomerId(nextId);
    if (nextId) {
      const params = new URLSearchParams(window.location.search);
      params.set("customerId", nextId);
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Ziyaret numarası otomatik atanır (VIS-{"{yıl}"}-{"{sıra}"}).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">Müşteri *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            value={customerId}
            onChange={(e) => onCustomerChange(e.target.value)}
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
          <Label htmlFor="userId">Saha personeli *</Label>
          <select
            id="userId"
            name="userId"
            required
            defaultValue={d.userId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seçin</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitDate">Ziyaret tarihi *</Label>
          <Input
            id="visitDate"
            name="visitDate"
            type="date"
            required
            defaultValue={toDateInputValue(d.visitDate)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextVisitDate">Sonraki ziyaret</Label>
          <Input
            id="nextVisitDate"
            name="nextVisitDate"
            type="date"
            defaultValue={toDateInputValue(d.nextVisitDate)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractId">Bağlı sözleşme</Label>
          <select
            id="contractId"
            name="contractId"
            defaultValue={d.contractId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={!customerId}
          >
            <option value="">Yok</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number} — {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceTicketId">Bağlı servis talebi</Label>
          <select
            id="serviceTicketId"
            name="serviceTicketId"
            defaultValue={d.serviceTicketId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={!customerId}
          >
            <option value="">Yok</option>
            {serviceTickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ticketNo} — {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Açıklama *</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={4}
            defaultValue={d.description}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="result">Sonuç / notlar</Label>
          <Textarea
            id="result"
            name="result"
            rows={3}
            defaultValue={d.result ?? ""}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : submitLabel}
      </Button>
    </form>
  );
}

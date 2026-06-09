"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceTicketFormInput } from "@/lib/validations/service-ticket";
import type { ActionResult } from "@/lib/actions/types";
import { SERVICE_PRIORITY_LABELS } from "@/lib/services/service-ticket-state-machine";
import type { TaskPriority } from "@prisma/client";

type CustomerOption = { id: string; legalName: string };
type ContractOption = { id: string; number: string; title: string };
type UserOption = { id: string; firstName: string; lastName: string };

type Props = {
  customers: CustomerOption[];
  contracts: ContractOption[];
  users: UserOption[];
  defaultValues?: Partial<ServiceTicketFormInput>;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

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
        toast.success("Servis talebi kaydedildi");
        router.push(`/service-tickets/${result.data.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Talep numarası otomatik atanır (SRV-{"{yıl}"}-{"{sıra}"}).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Başlık *</Label>
          <Input id="title" name="title" required defaultValue={d.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">Müşteri *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
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
          <Label htmlFor="contractId">Bağlı sözleşme</Label>
          <select
            id="contractId"
            name="contractId"
            defaultValue={d.contractId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          <Label htmlFor="priority">Öncelik</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={d.priority ?? "MEDIUM"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {(Object.keys(SERVICE_PRIORITY_LABELS) as TaskPriority[]).map(
              (p) => (
                <option key={p} value={p}>
                  {SERVICE_PRIORITY_LABELS[p]}
                </option>
              )
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedUserId">Atanan personel</Label>
          <select
            id="assignedUserId"
            name="assignedUserId"
            defaultValue={d.assignedUserId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Atanmadı</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={d.description}
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

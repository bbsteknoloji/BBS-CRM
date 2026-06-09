"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TaskFormInput } from "@/lib/validations/task";
import type { ActionResult } from "@/lib/actions/types";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/utils/task-labels";
import { TaskDeleteButton } from "./task-delete-button";

type CustomerOption = { id: string; legalName: string };
type QuoteOption = {
  id: string;
  number: string;
  title: string;
  customerId: string;
};
type ContractOption = {
  id: string;
  number: string;
  title: string;
  customerId: string;
};
type UserOption = { id: string; firstName: string; lastName: string };

type Props = {
  customers: CustomerOption[];
  quotes: QuoteOption[];
  contracts: ContractOption[];
  users: UserOption[];
  defaultValues?: Partial<TaskFormInput>;
  taskId?: string;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
  canDelete?: boolean;
};

function toDateInputValue(d?: string | Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function TaskForm({
  customers,
  quotes,
  contracts,
  users,
  defaultValues,
  taskId,
  submitLabel,
  onSubmit,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState(
    defaultValues?.customerId ?? ""
  );
  const d = defaultValues ?? {};

  const filteredQuotes = useMemo(
    () =>
      customerId
        ? quotes.filter((q) => q.customerId === customerId)
        : quotes,
    [customerId, quotes]
  );

  const filteredContracts = useMemo(
    () =>
      customerId
        ? contracts.filter((c) => c.customerId === customerId)
        : contracts,
    [customerId, contracts]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result.success) {
        toast.success(taskId ? "Görev güncellendi" : "Görev oluşturuldu");
        router.push("/tasks");
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

  function onCustomerChange(nextId: string) {
    setCustomerId(nextId);
    const params = new URLSearchParams(window.location.search);
    if (nextId) params.set("customerId", nextId);
    else params.delete("customerId");
    router.push(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Başlık *</Label>
          <Input id="title" name="title" required defaultValue={d.title} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={d.description ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Öncelik *</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={d.priority ?? "MEDIUM"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TASK_PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Durum *</Label>
          <select
            id="status"
            name="status"
            defaultValue={d.status ?? "TODO"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TASK_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startAt">Başlangıç Tarihi</Label>
          <Input
            id="startAt"
            name="startAt"
            type="date"
            defaultValue={toDateInputValue(d.startAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueAt">Bitiş Tarihi</Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="date"
            defaultValue={toDateInputValue(d.dueAt)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="assignedToId">Atanan Kullanıcı *</Label>
          <select
            id="assignedToId"
            name="assignedToId"
            required
            defaultValue={d.assignedToId ?? ""}
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerId">İlgili Müşteri</Label>
          <select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seçilmedi</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quoteId">İlgili Teklif</Label>
          <select
            id="quoteId"
            name="quoteId"
            defaultValue={d.quoteId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seçilmedi</option>
            {filteredQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.number} — {q.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractId">İlgili Sözleşme</Label>
          <select
            id="contractId"
            name="contractId"
            defaultValue={d.contractId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seçilmedi</option>
            {filteredContracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number} — {c.title}
              </option>
            ))}
          </select>
        </div>
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
        {canDelete && taskId ? (
          <TaskDeleteButton taskId={taskId} taskTitle={d.title ?? "Görev"} />
        ) : null}
      </div>
    </form>
  );
}

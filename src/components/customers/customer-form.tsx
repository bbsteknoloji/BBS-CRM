"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMER_STATUS_OPTIONS } from "@/lib/constants/customer";
import type { CustomerFormInput } from "@/lib/validations/customer";
import type { ActionResult } from "@/lib/actions/types";

type UserOption = { id: string; name: string };

type Props = {
  defaultValues?: Partial<CustomerFormInput>;
  users: UserOption[];
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
};

export function CustomerForm({
  defaultValues,
  users,
  submitLabel,
  onSubmit,
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
        toast.success("Kayıt başarılı");
        router.push(`/customers/${result.data.id}`);
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Firma bilgileri
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legalName">Firma adı *</Label>
            <Input
              id="legalName"
              name="legalName"
              required
              defaultValue={d.legalName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tradeName">Ticari ünvan</Label>
            <Input
              id="tradeName"
              name="tradeName"
              defaultValue={d.tradeName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxNumber">Vergi numarası *</Label>
            <Input
              id="taxNumber"
              name="taxNumber"
              required
              maxLength={11}
              defaultValue={d.taxNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxOffice">Vergi dairesi</Label>
            <Input
              id="taxOffice"
              name="taxOffice"
              defaultValue={d.taxOffice ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Web sitesi</Label>
            <Input
              id="website"
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="www.ornek.com"
              defaultValue={d.website ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Durum *</Label>
            <select
              id="status"
              name="status"
              required
              defaultValue={d.status ?? "LEAD"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CUSTOMER_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedToId">Sorumlu kullanıcı</Label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue={d.assignedToId ?? ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seçin</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          İletişim
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authorizedPerson">Yetkili kişi</Label>
            <Input
              id="authorizedPerson"
              name="authorizedPerson"
              defaultValue={d.authorizedPerson ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={d.phone ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={d.email ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Adres
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine">Adres *</Label>
            <Input
              id="addressLine"
              name="addressLine"
              required
              defaultValue={d.addressLine}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">İlçe</Label>
            <Input
              id="district"
              name="district"
              defaultValue={d.district ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Şehir *</Label>
            <Input id="city" name="city" required defaultValue={d.city} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Posta kodu</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={d.postalCode ?? ""}
            />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={d.notes ?? ""} />
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

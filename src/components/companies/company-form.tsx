"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyFormInput } from "@/lib/validations/company";
import type { ActionResult } from "@/lib/actions/types";

type Props = {
  defaultValues?: Partial<CompanyFormInput>;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string } | void>>;
  backHref?: string;
};

export function CompanyForm({ defaultValues, submitLabel, onSubmit, backHref = "/companies" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const d = defaultValues ?? {};

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result.success) {
        toast.success("Kaydedildi");
        router.push("/companies");
      } else {
        toast.error(result.error);
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
            <Label htmlFor="name">Firma adı *</Label>
            <Input id="name" name="name" required defaultValue={d.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" defaultValue={d.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={d.phone ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea id="address" name="address" rows={3} defaultValue={d.address ?? ""} />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          İptal
        </Button>
      </div>
    </form>
  );
}

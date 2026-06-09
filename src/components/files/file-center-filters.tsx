"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { PremiumFilterBar } from "@/components/premium/premium-filter-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchInput } from "@/hooks/use-search-input";

type CustomerOption = { id: string; legalName: string };
type UserOption = { id: string; firstName: string; lastName: string };

type Props = {
  customers: CustomerOption[];
  uploaders: UserOption[];
};

export function FileCenterFilters({ customers, uploaders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = useSearchInput("/files");

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      startTransition(() => router.push(`/files?${params.toString()}`));
    },
    [router, searchParams]
  );

  return (
    <PremiumFilterBar className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
        <Label className="text-xs text-muted-foreground">Dosya adı</Label>
        <Input
          placeholder="Ara…"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Müşteri</Label>
        <Select
          value={searchParams.get("customerId") ?? "all"}
          onValueChange={(v) =>
            update({ customerId: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.legalName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Modül</Label>
        <Select
          value={searchParams.get("module") ?? "all"}
          onValueChange={(v) =>
            update({ module: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="QUOTE">Teklif</SelectItem>
            <SelectItem value="CONTRACT">Sözleşme</SelectItem>
            <SelectItem value="CUSTOMER">Müşteri</SelectItem>
            <SelectItem value="SERVICE_TICKET">Servis Talebi</SelectItem>
            <SelectItem value="VISIT">Saha Ziyareti</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Dosya türü</Label>
        <Select
          value={searchParams.get("fileType") ?? "all"}
          onValueChange={(v) =>
            update({ fileType: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="ATTACHMENT">Ek</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Yükleyen</Label>
        <Select
          value={searchParams.get("uploadedById") ?? "all"}
          onValueChange={(v) =>
            update({ uploadedById: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {uploaders.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Başlangıç</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Bitiş</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
        />
      </div>
      {pending ? (
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <span className="text-sm text-muted-foreground">Filtreleniyor…</span>
        </div>
      ) : null}
    </PremiumFilterBar>
  );
}

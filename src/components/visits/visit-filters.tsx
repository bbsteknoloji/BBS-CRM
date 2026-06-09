"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PremiumFilterBar } from "@/components/premium/premium-filter-bar";
import { useSearchInput } from "@/hooks/use-search-input";

type CustomerOption = { id: string; legalName: string };

export function VisitFilters({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = useSearchInput("/visits");

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      startTransition(() => router.push(`/visits?${params.toString()}`));
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => router.push("/visits"));
  };

  const hasFilters =
    !!searchParams.get("q") ||
    !!searchParams.get("customerId") ||
    !!searchParams.get("upcoming") ||
    !!searchParams.get("dateFrom") ||
    !!searchParams.get("dateTo");

  return (
    <PremiumFilterBar className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
        <Label>Ara</Label>
        <Input
          placeholder="No, müşteri, açıklama…"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <div className="space-y-1">
        <Label>Müşteri</Label>
        <Select
          value={searchParams.get("customerId") ?? "all"}
          onValueChange={(v) => update({ customerId: v === "all" ? undefined : v })}
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
        <Label>Tarih (başlangıç)</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label>Tarih (bitiş)</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
        />
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={searchParams.get("upcoming") === "1"}
            onChange={(e) =>
              update({ upcoming: e.target.checked ? "1" : undefined })
            }
            className="rounded border-input"
          />
          Planlanan ziyaretler
        </label>
        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={pending}
          >
            Temizle
          </Button>
        ) : null}
        {pending ? (
          <span className="text-xs text-muted-foreground">Yükleniyor…</span>
        ) : null}
      </div>
    </PremiumFilterBar>
  );
}

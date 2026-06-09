"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PremiumFilterBar } from "@/components/premium/premium-filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUOTE_STATUS_LABELS } from "@/lib/services/quote-state-machine";
import type { QuoteStatus } from "@prisma/client";
import { useSearchInput } from "@/hooks/use-search-input";

type CustomerOption = { id: string; legalName: string };

export function QuoteFilters({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = useSearchInput("/quotes");

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      startTransition(() => router.push(`/quotes?${params.toString()}`));
    },
    [router, searchParams]
  );

  return (
    <PremiumFilterBar className="lg:flex-row lg:flex-wrap lg:items-end">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Teklif no, başlık, müşteri…"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => update({ status: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-full lg:w-[160px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm durumlar</SelectItem>
          {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {QUOTE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("customerId") ?? "all"}
        onValueChange={(v) =>
          update({ customerId: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-full lg:w-[200px]">
          <SelectValue placeholder="Müşteri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm müşteriler</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.legalName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        className="w-full lg:w-[150px]"
        defaultValue={searchParams.get("dateFrom") ?? ""}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
      />
      <Input
        type="date"
        className="w-full lg:w-[150px]"
        defaultValue={searchParams.get("dateTo") ?? ""}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
      />
      <Button
        variant="outline"
        type="button"
        disabled={pending}
        onClick={() => router.push("/quotes")}
      >
        Temizle
      </Button>
    </PremiumFilterBar>
  );
}

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
import { CONTRACT_STATUS_LABELS } from "@/lib/services/contract-state-machine";
import type { ContractStatus } from "@prisma/client";
import { useSearchInput } from "@/hooks/use-search-input";

type CustomerOption = { id: string; legalName: string };

const EXPIRY_OPTIONS = [
  { value: "7", label: "7 gün içinde bitecek" },
  { value: "15", label: "15 gün içinde" },
  { value: "30", label: "30 gün içinde" },
  { value: "60", label: "60 gün içinde" },
  { value: "90", label: "90 gün içinde" },
];

export function ContractFilters({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = useSearchInput("/contracts");

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      startTransition(() => router.push(`/contracts?${params.toString()}`));
    },
    [router, searchParams]
  );

  return (
    <PremiumFilterBar className="lg:flex-row lg:flex-wrap lg:items-end">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Sözleşme no, başlık, müşteri…"
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
          {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(
            (s) => (
              <SelectItem key={s} value={s}>
                {CONTRACT_STATUS_LABELS[s]}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("expiringWithinDays") ?? "all"}
        onValueChange={(v) =>
          update({
            expiringWithinDays: v === "all" ? undefined : v,
            status: v === "all" ? undefined : "ACTIVE",
          })
        }
      >
        <SelectTrigger className="w-full lg:w-[200px]">
          <SelectValue placeholder="Süre takibi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Süre filtresi yok</SelectItem>
          {EXPIRY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
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
      <Button
        variant="outline"
        type="button"
        disabled={pending}
        onClick={() => router.push("/contracts")}
      >
        Temizle
      </Button>
    </PremiumFilterBar>
  );
}

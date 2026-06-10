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
import {
  SERVICE_TICKET_STATUS_LABELS,
  SERVICE_PRIORITY_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/services/service-ticket-state-machine";
import type { ServiceTicketStatus, ServiceType } from "@prisma/client";
import type { TaskPriority } from "@prisma/client";
import { useSearchInput } from "@/hooks/use-search-input";

type CustomerOption = { id: string; legalName: string };

export function ServiceTicketFilters({
  customers,
}: {
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const search = useSearchInput("/service-tickets");

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      startTransition(() =>
        router.push(`/service-tickets?${params.toString()}`)
      );
    },
    [router, searchParams]
  );

  return (
    <PremiumFilterBar className="lg:flex-row lg:flex-wrap lg:items-end">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Talep no, başlık, müşteri…"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => update({ status: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-full lg:w-[180px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm durumlar</SelectItem>
          {(Object.keys(SERVICE_TICKET_STATUS_LABELS) as ServiceTicketStatus[]).map(
            (s) => (
              <SelectItem key={s} value={s}>
                {SERVICE_TICKET_STATUS_LABELS[s]}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("serviceType") ?? "all"}
        onValueChange={(v) => update({ serviceType: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-full lg:w-[180px]">
          <SelectValue placeholder="Servis Türü" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm türler</SelectItem>
          {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((k) => (
            <SelectItem key={k} value={k}>{SERVICE_TYPE_LABELS[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(v) => update({ priority: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-full lg:w-[140px]">
          <SelectValue placeholder="Öncelik" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm öncelikler</SelectItem>
          {(Object.keys(SERVICE_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <SelectItem key={p} value={p}>
              {SERVICE_PRIORITY_LABELS[p]}
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
        onClick={() => router.push("/service-tickets")}
      >
        Temizle
      </Button>
    </PremiumFilterBar>
  );
}

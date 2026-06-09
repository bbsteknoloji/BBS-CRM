"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PremiumFilterBar } from "@/components/premium/premium-filter-bar";
import { CUSTOMER_STATUS_OPTIONS } from "@/lib/constants/customer";
import { useSearchInput } from "@/hooks/use-search-input";

type UserOption = { id: string; name: string };
type Props = {
  cities: string[];
  users: UserOption[];
};

export function CustomerFilters({ cities, users }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Canlı arama — 300 ms debounce + Türkçe karakter normalleştirme
  const search = useSearchInput("/customers");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/customers?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => router.push("/customers"));
  };

  const hasFilters =
    !!searchParams.get("q") ||
    !!searchParams.get("status") ||
    !!searchParams.get("assignedToId") ||
    !!searchParams.get("city");

  return (
    <PremiumFilterBar className="sm:flex-row sm:flex-wrap sm:items-end">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Firma adı, vergi no, vergi dairesi, şehir, seri no ara..."
          className="pl-9"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) =>
          updateParams({ status: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm durumlar</SelectItem>
          {CUSTOMER_STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("assignedToId") ?? "all"}
        onValueChange={(v) =>
          updateParams({ assignedToId: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sorumlu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm sorumlular</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("city") ?? "all"}
        onValueChange={(v) =>
          updateParams({ city: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Şehir" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm şehirler</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={isPending}
        >
          Temizle
        </Button>
      ) : null}
      {isPending ? (
        <span className="text-xs text-muted-foreground">Yükleniyor…</span>
      ) : null}
    </PremiumFilterBar>
  );
}

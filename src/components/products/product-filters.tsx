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
import { useSearchInput } from "@/hooks/use-search-input";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = useSearchInput("/products");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => router.push("/products"));
  };

  const hasFilters =
    !!searchParams.get("q") || !!searchParams.get("isActive");

  return (
    <PremiumFilterBar className="sm:flex-row sm:flex-wrap sm:items-end">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ürün kodu veya adı ara…"
          className="pl-9"
          value={search.value}
          onChange={search.onChange}
        />
      </div>
      <Select
        value={searchParams.get("isActive") ?? "all"}
        onValueChange={(v) =>
          updateParams({ isActive: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
          <SelectItem value="true">Aktif</SelectItem>
          <SelectItem value="false">Pasif</SelectItem>
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

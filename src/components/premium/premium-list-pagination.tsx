"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PremiumListPaginationProps = {
  basePath: string;
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  shown: number;
  className?: string;
};

export function PremiumListPagination({
  basePath,
  total,
  hasMore,
  nextCursor,
  shown,
  className,
}: PremiumListPaginationProps) {
  const searchParams = useSearchParams();

  const buildHref = (cursor?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cursor) params.set("cursor", cursor);
    else params.delete("cursor");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Toplam <strong className="text-foreground">{total}</strong> kayıt ·
        gösterilen {shown}
      </p>
      <div className="flex gap-2">
        {searchParams.get("cursor") ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref()}>Başa dön</Link>
          </Button>
        ) : null}
        {hasMore && nextCursor ? (
          <Button size="sm" asChild>
            <Link href={buildHref(nextCursor)}>Daha fazla yükle</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

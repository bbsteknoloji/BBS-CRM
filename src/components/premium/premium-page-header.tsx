"use client";

import { cn } from "@/lib/utils";

type PremiumPageHeaderProps = {
  title: string;
  description?: string;
  /** Başlık altı: badge, meta bilgi */
  meta?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PremiumPageHeaderBar({
  title,
  description,
  meta,
  leading,
  actions,
  className,
}: PremiumPageHeaderProps) {
  return (
    <header
      className={cn(
        "glass-panel sticky top-0 z-40 flex shrink-0 items-center gap-4 border-b border-border/60 px-4 backdrop-blur-md sm:px-6",
        meta ? "min-h-16 py-3" : "h-16",
        className
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">
          {title}
        </h1>
        {meta ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">{meta}</div>
        ) : null}
        {description ? (
          <p
            className={cn(
              "truncate text-sm text-muted-foreground",
              meta ? "mt-1" : "mt-0"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      ) : null}
    </header>
  );
}

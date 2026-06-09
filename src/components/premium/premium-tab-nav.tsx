import Link from "next/link";
import { cn } from "@/lib/utils";

export type PremiumTabItem = {
  id: string;
  label: string;
};

type PremiumTabNavProps = {
  tabs: readonly PremiumTabItem[];
  activeTab: string;
  baseHref: string;
  paramName?: string;
  className?: string;
};

export function PremiumTabNav({
  tabs,
  activeTab,
  baseHref,
  paramName = "tab",
  className,
}: PremiumTabNavProps) {
  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto rounded-lg border border-border/50 bg-muted/50 p-1",
        className
      )}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`${baseHref}?${paramName}=${t.id}`}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover-lift",
            activeTab === t.id
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function PremiumTabPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-4", className)}>{children}</div>;
}

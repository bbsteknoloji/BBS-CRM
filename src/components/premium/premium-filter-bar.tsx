import { cn } from "@/lib/utils";

type PremiumFilterBarProps = {
  children: React.ReactNode;
  className?: string;
  onClear?: React.ReactNode;
};

export function PremiumFilterBar({
  children,
  className,
  onClear,
}: PremiumFilterBarProps) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
    >
      {children}
      {onClear}
    </div>
  );
}

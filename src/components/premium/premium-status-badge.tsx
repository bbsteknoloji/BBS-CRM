import { PremiumBadge } from "./premium-badge";
import type { BadgeProps } from "@/components/ui/badge";

export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "muted"
  | "secondary"
  | "outline";

type PremiumStatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

export function PremiumStatusBadge({
  label,
  tone = "default",
  className,
}: PremiumStatusBadgeProps) {
  return (
    <PremiumBadge variant={tone as BadgeProps["variant"]} className={className}>
      {label}
    </PremiumBadge>
  );
}

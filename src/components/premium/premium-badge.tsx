import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className, ...props }: BadgeProps) {
  return (
    <Badge
      className={cn("border-border/50 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

import { PremiumContentArea } from "@/components/premium/premium-app-shell";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <PremiumContentArea className={cn(className)}>{children}</PremiumContentArea>
  );
}

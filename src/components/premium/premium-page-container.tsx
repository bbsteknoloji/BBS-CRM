import { cn } from "@/lib/utils";

type PremiumPageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/** Sayfa gövdesi — PageShell içinde tek kök sarmalayıcı */
export function PremiumPageContainer({
  children,
  className,
}: PremiumPageContainerProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      {children}
    </div>
  );
}

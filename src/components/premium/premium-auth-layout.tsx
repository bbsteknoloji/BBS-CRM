import { BbsLogo } from "@/components/brand/bbs-logo";
import { cn } from "@/lib/utils";

type PremiumAuthLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function PremiumAuthLayout({
  children,
  className,
}: PremiumAuthLayoutProps) {
  return (
    <div className="bbs-app-gradient flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div
        className={cn(
          "flex w-full max-w-md flex-col items-center gap-8",
          className
        )}
      >
        <BbsLogo variant="dark" showTagline className="text-center" />
        <div className="glass-panel w-full rounded-xl p-1">{children}</div>
      </div>
    </div>
  );
}

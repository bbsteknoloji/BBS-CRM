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
          "flex w-full max-w-[420px] flex-col items-center gap-6 sm:gap-8",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <BbsLogo
            variant="dark"
            showTagline
            size="lg"
            className="text-center"
          />
        </div>
        <div className="glass-panel w-full rounded-2xl p-1 shadow-lg">
          {children}
        </div>
        <p className="text-center text-xs text-white/40">
          © {new Date().getFullYear()} BBS Teknoloji — Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}

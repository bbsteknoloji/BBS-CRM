import { cn } from "@/lib/utils";

type PremiumAppShellProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PremiumAppShell({
  sidebar,
  children,
  className,
}: PremiumAppShellProps) {
  return (
    <div className={cn("bbs-app-gradient flex min-h-screen", className)}>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function PremiumContentArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

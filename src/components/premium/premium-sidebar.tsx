import { BbsLogo } from "@/components/brand/bbs-logo";
import { cn } from "@/lib/utils";

type PremiumSidebarProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function PremiumSidebar({
  children,
  footer,
  className,
}: PremiumSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <BbsLogo variant="dark" showTagline className="text-sidebar-foreground" />
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      {footer ? (
        <div className="mt-auto border-t border-sidebar-border px-6 py-4">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

export function PremiumSidebarFooter({
  userName,
  roles,
}: {
  userName: string;
  roles: string[];
}) {
  return (
    <>
      <p className="truncate text-xs text-sidebar-foreground/60">{userName}</p>
      <p className="truncate text-xs text-sidebar-foreground/40">
        {roles.join(" · ")}
      </p>
    </>
  );
}

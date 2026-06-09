"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumDetailPanelProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  footer?: React.ReactNode;
};

export function PremiumDetailPanel({
  open,
  title,
  children,
  onClose,
  className,
  footer,
}: PremiumDetailPanelProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Paneli kapat"
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:top-16"
        onClick={onClose}
      />
      <aside
        className={cn(
          "glass-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l p-6 shadow-xl sm:top-16",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title ? <h3 className="font-semibold tracking-tight">{title}</h3> : <span />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="mt-4 border-t border-border/60 pt-4">{footer}</div> : null}
      </aside>
    </>
  );
}

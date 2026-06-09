import type { FileCenterModule } from "@/lib/services/file-center-types";
import { FILE_MODULE_LABELS } from "@/lib/utils/file-format";
import { cn } from "@/lib/utils";

const MODULE_STYLES: Record<FileCenterModule, string> = {
  QUOTE: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  CONTRACT: "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
  CUSTOMER: "bg-slate-500/20 text-slate-200 border-slate-500/30",
  SERVICE_TICKET: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  VISIT: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
};

type Props = {
  module: FileCenterModule;
  variant?: "premium" | "default";
  className?: string;
};

export function FileModuleBadge({
  module,
  variant = "default",
  className,
}: Props) {
  const label = FILE_MODULE_LABELS[module];
  if (variant === "default") {
    return (
      <span
        className={cn(
          "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
          className
        )}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
        MODULE_STYLES[module],
        className
      )}
    >
      {label}
    </span>
  );
}

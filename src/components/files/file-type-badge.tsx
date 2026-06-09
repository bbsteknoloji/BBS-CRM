import { cn } from "@/lib/utils";

export function FileTypeBadge({
  fileType,
  variant = "default",
  className,
}: {
  fileType: "PDF" | "ATTACHMENT";
  variant?: "premium" | "default";
  className?: string;
}) {
  const label = fileType === "PDF" ? "PDF" : "Ek";
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        variant === "premium"
          ? fileType === "PDF"
            ? "bg-red-500/20 text-red-200"
            : "bg-slate-500/20 text-slate-300"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}

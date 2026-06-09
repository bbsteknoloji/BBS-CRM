import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

/** Premium dosya merkezi kabuğu — FAZ 8'de diğer modüllere taşınabilir */
export function FileCenterShell({
  children,
  className,
  title,
  description,
}: Props) {
  return (
    <div
      className={cn(
        "file-center-theme bbs-app-gradient min-h-[60vh] rounded-xl p-4 sm:p-6",
        className
      )}
    >
      {title ? (
        <header className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function PremiumTableIconButton({
  children,
  className,
  title,
  href,
  target,
  rel,
  onClick,
}: BaseProps & {
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
}) {
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        title={title}
        className={cn(iconButtonClass, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(iconButtonClass, className)}
    >
      {children}
    </button>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PremiumCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function PremiumCard({ children, className }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "glass-panel glass-panel-hover hover-lift rounded-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

type KpiProps = {
  title: string;
  value: string;
  description?: string;
  href?: string;
  className?: string;
};

export function PremiumKpiCard({
  title,
  value,
  description,
  href,
  className,
}: KpiProps) {
  const inner = (
    <PremiumCard className={cn("p-4 sm:p-5", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </PremiumCard>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

type WidgetProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

export function PremiumWidgetCard({
  title,
  description,
  children,
  className,
  action,
}: WidgetProps) {
  return (
    <Card className={cn("glass-panel border-border/60 shadow-md", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="mt-1">{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

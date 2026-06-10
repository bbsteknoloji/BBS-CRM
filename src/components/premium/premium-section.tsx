import { cn } from "@/lib/utils";

type PremiumSectionProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

/** Bölüm aralığı — yalnızca dikey gruplama / spacing */
export function PremiumSection({
  children,
  className,
  title,
}: PremiumSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title && <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>}
      {children}
    </section>
  );
}

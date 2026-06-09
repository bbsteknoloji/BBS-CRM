import { cn } from "@/lib/utils";

type PremiumSectionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Bölüm aralığı — yalnızca dikey gruplama / spacing */
export function PremiumSection({
  children,
  className,
}: PremiumSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {children}
    </section>
  );
}

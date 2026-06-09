import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PremiumButtonProps = ButtonProps & {
  premiumVariant?: "primary" | "outline";
};

/** Premium aksiyon butonu — `premium-btn-primary` veya outline */
export const PremiumButton = React.forwardRef<
  HTMLButtonElement,
  PremiumButtonProps
>(function PremiumButton(
  { className, premiumVariant = "primary", variant, ...props },
  ref
) {
  const isPrimary = premiumVariant === "primary";
  return (
    <Button
      ref={ref}
      variant={variant ?? (isPrimary ? "default" : "outline")}
      className={cn(
        isPrimary && "premium-btn-primary border-transparent text-white hover:text-white",
        className
      )}
      {...props}
    />
  );
});

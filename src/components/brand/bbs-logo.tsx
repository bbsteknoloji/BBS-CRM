"use client";

import Image from "next/image";
import { useState } from "react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type Props = {
  /** Koyu arka planlarda dark logo, açık arka planda light */
  variant?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
};

/**
 * Kurumsal logo — public/logo.png varsa gösterilir;
 * dosya yoksa veya yüklenemezse metin fallback (brand.name).
 */
export function BbsLogo({
  variant = "dark",
  className,
  showTagline = false,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const src =
    variant === "dark"
      ? brand.logo.dark ?? brand.logo.default
      : brand.logo.default;

  if (imageFailed) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="text-sm font-semibold tracking-tight">{brand.name}</p>
        {showTagline && brand.slogan ? (
          <p className="text-xs text-muted-foreground">{brand.slogan}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <Image
        src={src}
        alt={brand.name}
        width={180}
        height={70}
        className="h-10 w-auto max-w-[200px] object-contain object-left"
        onError={() => setImageFailed(true)}
        priority
      />
      {showTagline && brand.slogan ? (
        <p className="text-xs text-muted-foreground">{brand.slogan}</p>
      ) : null}
    </div>
  );
}

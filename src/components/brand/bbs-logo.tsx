"use client";

import Image from "next/image";
import { useState } from "react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
  /** "default" = nav/header mini; "md" = sidebar prominent; "lg" = login ekranı büyük */
  size?: "default" | "md" | "lg";
};

export function BbsLogo({
  variant = "dark",
  className,
  showTagline = false,
  size = "default",
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const src =
    variant === "dark"
      ? brand.logo.dark ?? brand.logo.default
      : brand.logo.default;

  const isMd = size === "md";
  const isLg = size === "lg";
  const isBig = isMd || isLg;

  if (imageFailed) {
    return (
      <div className={cn("min-w-0", isBig && "flex flex-col items-center", className)}>
        <p
          className={cn(
            "font-semibold tracking-tight",
            isLg ? "text-2xl" : isMd ? "text-xl" : "text-sm"
          )}
        >
          {brand.name}
        </p>
        {showTagline && brand.slogan ? (
          <p
            className={cn(
              "text-muted-foreground",
              isBig ? "mt-1 text-sm" : "text-xs"
            )}
          >
            {brand.slogan}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        isBig ? "items-center" : "",
        className
      )}
      style={isBig ? { gap: isLg ? "8px" : "6px" } : { gap: "2px" }}
    >
      <Image
        src={src}
        alt={brand.name}
        width={isLg ? 480 : isMd ? 360 : 320}
        height={isLg ? 320 : isMd ? 240 : 124}
        className={cn(
          "object-contain",
          isLg
            ? "h-auto w-[220px] max-w-full sm:w-[240px]"
            : isMd
            ? "h-auto w-[170px] max-w-full"
            : "h-9 w-auto max-w-[160px] object-left"
        )}
        onError={() => setImageFailed(true)}
        priority
      />
      {showTagline && brand.slogan ? (
        <p
          className={cn(
            isLg
              ? "text-center text-sm font-medium tracking-wide text-muted-foreground"
              : isMd
              ? "text-center text-[11px] font-medium tracking-wide opacity-60"
              : "text-xs text-muted-foreground"
          )}
        >
          {brand.slogan}
        </p>
      ) : null}
    </div>
  );
}

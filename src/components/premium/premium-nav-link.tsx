"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumNavLinkProps = {
  href: string;
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick?: () => void;
};

export function PremiumNavLink({
  href,
  title,
  icon: Icon,
  isActive,
  onClick,
}: PremiumNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "hover-lift flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-white shadow-sm ring-1 ring-white/10"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      {title}
    </Link>
  );
}

"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BbsLogo } from "@/components/brand/bbs-logo";
import type { NavItem } from "@/config/navigation";
import { resolveNavIcon } from "@/config/nav-icons";
import { PremiumNavLink } from "./premium-nav-link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PremiumMobileNavProps = {
  navItems: NavItem[];
  triggerClassName?: string;
};

export function PremiumMobileNav({
  navItems,
  triggerClassName,
}: PremiumMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "border-border/60 bg-card/50 lg:hidden",
            triggerClassName
          )}
          aria-label="Menüyü aç"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-[280px]"
      >
        <div
          className="flex flex-col items-center border-b border-sidebar-border px-4"
          style={{ paddingTop: "20px", paddingBottom: "16px" }}
        >
          <BbsLogo
            variant="dark"
            showTagline
            size="md"
            className="text-sidebar-foreground"
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <PremiumNavLink
                key={item.href}
                href={item.href}
                title={item.title}
                icon={resolveNavIcon(item.icon)}
                isActive={isActive}
                onClick={() => setOpen(false)}
              />
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

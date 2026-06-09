"use client";

import { PremiumMobileNav } from "@/components/premium/premium-mobile-nav";
import type { NavItem } from "@/config/navigation";

type MobileSidebarProps = {
  navItems: NavItem[];
};

/** Mobil menü — layout wrapper; render PremiumMobileNav */
export function MobileSidebar({ navItems }: MobileSidebarProps) {
  return <PremiumMobileNav navItems={navItems} />;
}

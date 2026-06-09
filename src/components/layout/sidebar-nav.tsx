"use client";

import { usePathname } from "next/navigation";
import { PremiumNavLink } from "@/components/premium/premium-nav-link";
import type { NavItem } from "@/config/navigation";
import { resolveNavIcon } from "@/config/nav-icons";

type SidebarNavProps = {
  items: NavItem[];
  onNavigate?: () => void;
};

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => {
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
            onClick={onNavigate}
          />
        );
      })}
    </nav>
  );
}

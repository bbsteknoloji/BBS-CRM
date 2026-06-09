import { filterNavigationByPermissions } from "@/config/navigation";
import type { SessionUser } from "@/lib/permissions/types";
import {
  PremiumSidebar,
  PremiumSidebarFooter,
} from "@/components/premium/premium-sidebar";
import { SidebarNav } from "./sidebar-nav";

type SidebarProps = {
  user: SessionUser;
};

export function Sidebar({ user }: SidebarProps) {
  const navItems = filterNavigationByPermissions(user.permissions);

  return (
    <PremiumSidebar
      footer={
        <PremiumSidebarFooter
          userName={user.name}
          roles={user.roles}
        />
      }
    >
      <SidebarNav items={navItems} />
    </PremiumSidebar>
  );
}

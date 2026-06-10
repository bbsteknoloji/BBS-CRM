import { getSessionUser } from "@/lib/auth/session";
import { filterNavigationByPermissions } from "@/config/navigation";
import { HeaderClient } from "./header-client";

type HeaderProps = {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  pageActions?: React.ReactNode;
};

export async function Header({
  title,
  description,
  meta,
  pageActions,
}: HeaderProps) {
  const user = await getSessionUser();
  const navItems = user
    ? filterNavigationByPermissions(user.permissions)
    : [];

  return (
    <HeaderClient
      title={title}
      description={description}
      meta={meta}
      pageActions={pageActions}
      userName={user?.name ?? ""}
      userEmail={user?.email ?? ""}
      userRole={user?.roles?.[0] ?? ""}
      navItems={navItems}
    />
  );
}

import { requireAuth } from "@/lib/permissions/server";
import { PremiumAppShell } from "@/components/premium/premium-app-shell";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export async function DashboardShell({ children }: DashboardShellProps) {
  const user = await requireAuth();

  return (
    <PremiumAppShell sidebar={<Sidebar user={user} />}>
      {children}
    </PremiumAppShell>
  );
}

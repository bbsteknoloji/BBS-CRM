import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { PremiumPageContainer } from "@/components/premium";
import { CompanyTable } from "@/components/companies/company-table";
import { listCompanies } from "@/lib/services/company-service";

export const metadata = { title: "Firmalar" };

export default async function CompaniesPage() {
  const user = await requirePermission("company:manage");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companies = (await listCompanies(user)) as any[];

  return (
    <>
      <Header
        title="Firmalar"
        description="Tenant firmaları yönet"
        pageActions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus className="mr-2 h-4 w-4" />
              Yeni firma
            </Link>
          </Button>
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <CompanyTable companies={companies} />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

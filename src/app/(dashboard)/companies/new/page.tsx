import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PremiumPageContainer } from "@/components/premium";
import { CompanyForm } from "@/components/companies/company-form";
import { createCompanyAndRedirect } from "@/actions/companies/create-company";

export const metadata = { title: "Yeni firma" };

export default async function NewCompanyPage() {
  await requirePermission("company:manage");

  return (
    <>
      <Header title="Yeni firma" description="Sisteme yeni tenant firma ekle" />
      <PageShell>
        <PremiumPageContainer className="max-w-2xl">
          <CompanyForm submitLabel="Firma oluştur" onSubmit={createCompanyAndRedirect} />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

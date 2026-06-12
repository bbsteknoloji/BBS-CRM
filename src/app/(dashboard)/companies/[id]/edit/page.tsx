import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { PremiumPageContainer, PremiumSection } from "@/components/premium";
import { CompanyForm } from "@/components/companies/company-form";
import { CompanyUsersTable } from "@/components/companies/company-users-table";
import { updateCompanyAction } from "@/actions/companies/update-company";
import { getCompanyWithUsers } from "@/lib/services/company-service";

export const metadata = { title: "Firma düzenle" };

type Props = { params: Promise<{ id: string }> };

export default async function EditCompanyPage({ params }: Props) {
  const user = await requirePermission("company:manage");
  const { id } = await params;
  const company = await getCompanyWithUsers(user, id);
  if (!company) notFound();

  const submitAction = updateCompanyAction.bind(null, id);

  return (
    <>
      <Header
        title={company.name}
        description="Firma bilgilerini ve kullanıcılarını yönet"
      />
      <PageShell>
        <PremiumPageContainer className="max-w-2xl space-y-10">
          <PremiumSection title="Firma bilgileri">
            <CompanyForm
              defaultValues={{
                name: company.name,
                email: company.email ?? "",
                phone: company.phone ?? "",
                address: company.address ?? "",
              }}
              submitLabel="Güncelle"
              onSubmit={submitAction}
            />
          </PremiumSection>

          <PremiumSection title={`Kullanıcılar (${company.users.length})`}>
            <CompanyUsersTable users={company.users} companyId={id} />
          </PremiumSection>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

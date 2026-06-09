import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { PremiumPageContainer, PremiumSection } from "@/components/premium";
import { CustomerImportWizard } from "@/components/customers/customer-import-wizard";

export const metadata = { title: "Müşteri İçe Aktar" };

export default async function CustomerImportPage() {
  await requirePermission("customer:import");

  return (
    <>
      <Header
        title="Logo İşbaşı Cari Aktarım"
        description="Excel veya CSV dosyasından toplu müşteri içe aktarımı"
        pageActions={
          <Button asChild variant="outline" size="sm">
            <Link href="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Müşteriler
            </Link>
          </Button>
        }
      />
      <PageShell>
        <PremiumPageContainer>
          <PremiumSection>
            <CustomerImportWizard />
          </PremiumSection>
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

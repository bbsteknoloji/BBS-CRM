import { requirePermission } from "@/lib/permissions/server";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ProductForm } from "@/components/products/product-form";
import { PremiumPageContainer } from "@/components/premium";
import { createProductAction } from "@/actions/products/create-product";

export const metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requirePermission("product:create");

  return (
    <>
      <Header title="Yeni ürün" description="Kataloğa ürün veya hizmet ekleyin" />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <ProductForm submitLabel="Ürün oluştur" onSubmit={createProductAction} />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

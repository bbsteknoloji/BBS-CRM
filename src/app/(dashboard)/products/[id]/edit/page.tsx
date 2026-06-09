import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { hasPermission } from "@/lib/permissions/check";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { ProductForm } from "@/components/products/product-form";
import { PremiumPageContainer } from "@/components/premium";
import { updateProductAction } from "@/actions/products/update-product";
import {
  getProductById,
  productToFormInput,
} from "@/lib/services/product-service";

export const metadata = { title: "Ürün düzenle" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const user = await requirePermission("product:update");
  const canDelete = hasPermission(user, "product:delete");

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const boundUpdate = updateProductAction.bind(null, id);

  return (
    <>
      <Header
        title="Ürün düzenle"
        description={product.sku}
      />
      <PageShell>
        <PremiumPageContainer className="max-w-3xl">
          <ProductForm
            productId={id}
            defaultValues={productToFormInput(product)}
            submitLabel="Kaydet"
            onSubmit={boundUpdate}
            canDelete={canDelete}
          />
        </PremiumPageContainer>
      </PageShell>
    </>
  );
}

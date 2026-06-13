-- AlterEnum: Add COMPANY_ADMIN and MANAGER roles
ALTER TYPE "RoleCode" ADD VALUE 'COMPANY_ADMIN';
ALTER TYPE "RoleCode" ADD VALUE 'MANAGER';

-- AlterTable: Enhance companies with SaaS fields
ALTER TABLE "companies"
  ADD COLUMN "tax_number"       VARCHAR(20),
  ADD COLUMN "tax_office"       VARCHAR(100),
  ADD COLUMN "website"          VARCHAR(255),
  ADD COLUMN "city"             VARCHAR(100),
  ADD COLUMN "country"          VARCHAR(2) NOT NULL DEFAULT 'TR',
  ADD COLUMN "default_currency" "Currency" NOT NULL DEFAULT 'TRY';

-- AlterTable: Add company_id to products (drop global sku unique first)
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_sku_key";
ALTER TABLE "products" ADD COLUMN "company_id" UUID;

-- Assign all existing products to the first company (BBS Teknoloji)
UPDATE "products"
SET "company_id" = (SELECT "id" FROM "companies" ORDER BY "created_at" ASC LIMIT 1)
WHERE "company_id" IS NULL;

-- FK: products → companies
ALTER TABLE "products"
  ADD CONSTRAINT "products_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;

-- Per-tenant SKU uniqueness (replaces global @unique)
CREATE UNIQUE INDEX "products_company_id_sku_key" ON "products"("company_id", "sku");

-- Index for tenant filtering
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'QUOTE_REVISED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'QUOTE_CONVERTED';

-- CreateTable
CREATE TABLE "quote_revisions" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtotal" DECIMAL(18,4) NOT NULL,
    "tax_total" DECIMAL(18,4) NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "notes" TEXT,
    "line_items" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,

    CONSTRAINT "quote_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_pdf_versions" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "quote_version" INTEGER NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "relative_path" VARCHAR(500) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL DEFAULT 'application/pdf',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,

    CONSTRAINT "quote_pdf_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quote_revisions_quote_id_version_key" ON "quote_revisions"("quote_id", "version");
CREATE INDEX "quote_revisions_quote_id_idx" ON "quote_revisions"("quote_id");

CREATE UNIQUE INDEX "quote_pdf_versions_quote_id_quote_version_key" ON "quote_pdf_versions"("quote_id", "quote_version");
CREATE INDEX "quote_pdf_versions_quote_id_idx" ON "quote_pdf_versions"("quote_id");

ALTER TABLE "quote_revisions" ADD CONSTRAINT "quote_revisions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_pdf_versions" ADD CONSTRAINT "quote_pdf_versions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

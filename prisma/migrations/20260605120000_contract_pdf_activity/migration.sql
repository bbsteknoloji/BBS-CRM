-- ActivityType
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_ACTIVATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_SUSPENDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_EXPIRED';

-- AuditAction
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'RENEW';

-- ContractRenewal
ALTER TABLE "contract_renewals" ADD COLUMN IF NOT EXISTS "new_contract_id" UUID;

CREATE TABLE IF NOT EXISTS "contract_pdf_versions" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "storage_key" VARCHAR(500) NOT NULL,
    "relative_path" VARCHAR(500) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL DEFAULT 'application/pdf',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    CONSTRAINT "contract_pdf_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contract_pdf_versions_contract_id_version_key"
  ON "contract_pdf_versions"("contract_id", "version");
CREATE INDEX IF NOT EXISTS "contract_pdf_versions_contract_id_idx"
  ON "contract_pdf_versions"("contract_id");
CREATE INDEX IF NOT EXISTS "contract_renewals_new_contract_id_idx"
  ON "contract_renewals"("new_contract_id");

ALTER TABLE "contract_pdf_versions"
  ADD CONSTRAINT "contract_pdf_versions_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

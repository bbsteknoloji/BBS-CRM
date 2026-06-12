-- Multi-tenant veri izolasyonu: customers, contracts, quotes,
-- service_tickets, tasks, visit_records, number_sequences tablolarına
-- company_id eklendi. Mevcut veriler backfill scripti ile atanır.

-- customers
ALTER TABLE "customers" ADD COLUMN "company_id" UUID;
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- contracts
ALTER TABLE "contracts" ADD COLUMN "company_id" UUID;
CREATE INDEX "contracts_company_id_idx" ON "contracts"("company_id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- quotes
ALTER TABLE "quotes" ADD COLUMN "company_id" UUID;
CREATE INDEX "quotes_company_id_idx" ON "quotes"("company_id");
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- service_tickets
ALTER TABLE "service_tickets" ADD COLUMN "company_id" UUID;
CREATE INDEX "service_tickets_company_id_idx" ON "service_tickets"("company_id");
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- tasks
ALTER TABLE "tasks" ADD COLUMN "company_id" UUID;
CREATE INDEX "tasks_company_id_idx" ON "tasks"("company_id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- visit_records
ALTER TABLE "visit_records" ADD COLUMN "company_id" UUID;
CREATE INDEX "visit_records_company_id_idx" ON "visit_records"("company_id");
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- number_sequences: eski unique constraint kaldır, company_id ekle, yeni compound unique
ALTER TABLE "number_sequences" ADD COLUMN "company_id" UUID;
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "number_sequences" DROP CONSTRAINT IF EXISTS "number_sequences_type_year_key";
DROP INDEX IF EXISTS "number_sequences_type_year_key";
CREATE UNIQUE INDEX "number_sequences_company_id_type_year_key"
  ON "number_sequences"("company_id", "type", "year");

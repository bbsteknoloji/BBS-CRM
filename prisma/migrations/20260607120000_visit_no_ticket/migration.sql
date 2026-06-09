-- NumberSequenceType
ALTER TYPE "NumberSequenceType" ADD VALUE IF NOT EXISTS 'VISIT';

-- visit_records
ALTER TABLE "visit_records" ADD COLUMN IF NOT EXISTS "visit_no" VARCHAR(30);
ALTER TABLE "visit_records" ADD COLUMN IF NOT EXISTS "service_ticket_id" UUID;

UPDATE "visit_records"
SET "visit_no" = 'VIS-LEGACY-' || SUBSTRING("id"::text, 1, 8)
WHERE "visit_no" IS NULL;

ALTER TABLE "visit_records" ALTER COLUMN "visit_no" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "visit_records_visit_no_key" ON "visit_records"("visit_no");
CREATE INDEX IF NOT EXISTS "visit_records_service_ticket_id_idx" ON "visit_records"("service_ticket_id");
CREATE INDEX IF NOT EXISTS "visit_records_created_at_idx" ON "visit_records"("created_at" DESC);

ALTER TABLE "visit_records"
  ADD CONSTRAINT "visit_records_service_ticket_id_fkey"
  FOREIGN KEY ("service_ticket_id") REFERENCES "service_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

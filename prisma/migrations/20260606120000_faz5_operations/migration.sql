-- RoleCode
ALTER TYPE "RoleCode" ADD VALUE IF NOT EXISTS 'TECHNICIAN';
ALTER TYPE "RoleCode" ADD VALUE IF NOT EXISTS 'FIELD_OPS';

-- CustomerHealthStatus
CREATE TYPE "CustomerHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'RISK');

-- ServiceTicketStatus
CREATE TYPE "ServiceTicketStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'RESOLVED',
  'CLOSED'
);

-- NumberSequenceType
ALTER TYPE "NumberSequenceType" ADD VALUE IF NOT EXISTS 'SERVICE';

-- ActivityType
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_STATUS_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_ASSIGNED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_CLOSED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'VISIT_RECORDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'VISIT_UPDATED';

-- DocumentEntityType
ALTER TYPE "DocumentEntityType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET';
ALTER TYPE "DocumentEntityType" ADD VALUE IF NOT EXISTS 'VISIT';

-- NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_TICKET_STATUS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'VISIT_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CUSTOMER_HEALTH_RISK';

-- Customer health cache
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "health_status" "CustomerHealthStatus";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "health_computed_at" TIMESTAMPTZ(6);
CREATE INDEX IF NOT EXISTS "customers_health_status_idx" ON "customers"("health_status");

-- Activity FKs
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "service_ticket_id" UUID;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "visit_record_id" UUID;
CREATE INDEX IF NOT EXISTS "activities_service_ticket_id_idx" ON "activities"("service_ticket_id");
CREATE INDEX IF NOT EXISTS "activities_visit_record_id_idx" ON "activities"("visit_record_id");

-- service_tickets
CREATE TABLE IF NOT EXISTS "service_tickets" (
    "id" UUID NOT NULL,
    "ticket_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "contract_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ServiceTicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_user_id" UUID,
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_tickets_ticket_no_key" ON "service_tickets"("ticket_no");
CREATE INDEX IF NOT EXISTS "service_tickets_customer_id_status_idx" ON "service_tickets"("customer_id", "status");
CREATE INDEX IF NOT EXISTS "service_tickets_assigned_user_id_status_idx" ON "service_tickets"("assigned_user_id", "status");
CREATE INDEX IF NOT EXISTS "service_tickets_status_opened_at_idx" ON "service_tickets"("status", "opened_at" DESC);
CREATE INDEX IF NOT EXISTS "service_tickets_contract_id_idx" ON "service_tickets"("contract_id");
CREATE INDEX IF NOT EXISTS "service_tickets_deleted_at_idx" ON "service_tickets"("deleted_at");
CREATE INDEX IF NOT EXISTS "service_tickets_created_at_idx" ON "service_tickets"("created_at" DESC);

ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_updated_by_id_fkey"
  FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- visit_records
CREATE TABLE IF NOT EXISTS "visit_records" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "contract_id" UUID,
    "user_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT,
    "next_visit_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    CONSTRAINT "visit_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "visit_records_customer_id_visit_date_idx" ON "visit_records"("customer_id", "visit_date" DESC);
CREATE INDEX IF NOT EXISTS "visit_records_user_id_visit_date_idx" ON "visit_records"("user_id", "visit_date" DESC);
CREATE INDEX IF NOT EXISTS "visit_records_next_visit_date_idx" ON "visit_records"("next_visit_date");
CREATE INDEX IF NOT EXISTS "visit_records_contract_id_idx" ON "visit_records"("contract_id");
CREATE INDEX IF NOT EXISTS "visit_records_deleted_at_idx" ON "visit_records"("deleted_at");

ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_updated_by_id_fkey"
  FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities" ADD CONSTRAINT "activities_service_ticket_id_fkey"
  FOREIGN KEY ("service_ticket_id") REFERENCES "service_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_visit_record_id_fkey"
  FOREIGN KEY ("visit_record_id") REFERENCES "visit_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

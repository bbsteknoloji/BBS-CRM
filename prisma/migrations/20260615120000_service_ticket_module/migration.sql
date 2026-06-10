-- Teknik Servis Modülü: yeni enum'lar, ServiceTicket genişletmesi, yeni tablolar

-- Yeni enum: ServiceType
DO $$ BEGIN
  CREATE TYPE "ServiceType" AS ENUM (
    'FAULT_RESPONSE', 'MAINTENANCE', 'INSTALLATION', 'CONFIGURATION',
    'SYSTEM_UPDATE', 'ONSITE_SUPPORT', 'REMOTE_SUPPORT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Yeni enum: SystemType
DO $$ BEGIN
  CREATE TYPE "SystemType" AS ENUM (
    'FIREWALL', 'SWITCH', 'ACCESS_POINT', 'CAMERA_SYSTEM',
    'NVR_DVR', 'SERVER', 'HOTSPOT_SYSTEM', 'NETWORK_INFRASTRUCTURE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ServiceTicket tablosuna yeni sütunlar ekle
ALTER TABLE "service_tickets"
  ADD COLUMN IF NOT EXISTS "service_type"  "ServiceType" NOT NULL DEFAULT 'FAULT_RESPONSE',
  ADD COLUMN IF NOT EXISTS "system_type"   "SystemType",
  ADD COLUMN IF NOT EXISTS "brand"         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "model"         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "serial_no"     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "location"      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "inventory_no"  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "work_done"     TEXT,
  ADD COLUMN IF NOT EXISTS "tech_notes"    TEXT,
  ADD COLUMN IF NOT EXISTS "currency"      "Currency" NOT NULL DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS "subtotal"      DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tax_total"     DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total"         DECIMAL(18,4) NOT NULL DEFAULT 0;

-- Index: service_type
CREATE INDEX IF NOT EXISTS "service_tickets_service_type_idx" ON "service_tickets"("service_type");

-- Yeni tablo: service_ticket_line_items
CREATE TABLE IF NOT EXISTS "service_ticket_line_items" (
  "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
  "service_ticket_id" UUID        NOT NULL,
  "sort_order"        INTEGER     NOT NULL DEFAULT 0,
  "description"       VARCHAR(500) NOT NULL,
  "quantity"          DECIMAL(12,4) NOT NULL,
  "unit"              VARCHAR(30)  NOT NULL DEFAULT 'adet',
  "unit_price"        DECIMAL(18,4) NOT NULL,
  "tax_rate"          DECIMAL(5,2)  NOT NULL,
  "line_total"        DECIMAL(18,4) NOT NULL,

  CONSTRAINT "service_ticket_line_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_ticket_line_items_service_ticket_id_fkey"
    FOREIGN KEY ("service_ticket_id")
    REFERENCES "service_tickets"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "service_ticket_line_items_service_ticket_id_idx"
  ON "service_ticket_line_items"("service_ticket_id");

-- Yeni tablo: service_ticket_pdf_versions
CREATE TABLE IF NOT EXISTS "service_ticket_pdf_versions" (
  "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
  "service_ticket_id" UUID        NOT NULL,
  "version"           INTEGER     NOT NULL DEFAULT 1,
  "storage_key"       VARCHAR(500) NOT NULL,
  "relative_path"     VARCHAR(500) NOT NULL,
  "size_bytes"        INTEGER     NOT NULL DEFAULT 0,
  "mime_type"         VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_by_id"     UUID,

  CONSTRAINT "service_ticket_pdf_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_ticket_pdf_versions_service_ticket_id_fkey"
    FOREIGN KEY ("service_ticket_id")
    REFERENCES "service_tickets"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "service_ticket_pdf_versions_service_ticket_id_idx"
  ON "service_ticket_pdf_versions"("service_ticket_id");

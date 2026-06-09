-- Müşteri cihaz envanteri
CREATE TABLE "customer_devices" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "device_name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "customer_devices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_devices_customer_id_idx" ON "customer_devices"("customer_id");
CREATE INDEX "customer_devices_customer_id_deleted_at_idx" ON "customer_devices"("customer_id", "deleted_at");
CREATE INDEX "customer_devices_serial_number_idx" ON "customer_devices"("serial_number");

ALTER TABLE "customer_devices" ADD CONSTRAINT "customer_devices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

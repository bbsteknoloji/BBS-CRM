-- FAZ 3: ContractDevice junction + template placeholder snapshot
ALTER TABLE "contracts" ADD COLUMN "template_data" JSONB;

CREATE TABLE "contract_devices" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contract_devices_contract_id_device_id_key" ON "contract_devices"("contract_id", "device_id");
CREATE INDEX "contract_devices_contract_id_idx" ON "contract_devices"("contract_id");
CREATE INDEX "contract_devices_device_id_idx" ON "contract_devices"("device_id");

ALTER TABLE "contract_devices" ADD CONSTRAINT "contract_devices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_devices" ADD CONSTRAINT "contract_devices_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "customer_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

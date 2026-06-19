-- Prescription + pharmacy foundation
-- Adds structured prescription items and dispense records

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PARTIAL', 'DISPENSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescriptionItemStatus" AS ENUM ('PENDING', 'PARTIAL', 'DISPENSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "prescriptions"
  ADD COLUMN "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "prescribedById" TEXT,
  ADD COLUMN "prescriptionNumber" TEXT,
  ADD COLUMN "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- Best-effort backfill for any legacy rows
UPDATE "prescriptions" p
SET
  "prescribedById" = e."doctorId",
  "prescriptionNumber" = COALESCE(p."prescriptionNumber", 'RX-LEGACY-' || SUBSTRING(p."id" FROM 1 FOR 8)),
  "prescribedAt" = COALESCE(p."createdAt", CURRENT_TIMESTAMP),
  "status" = CASE WHEN p."isDispensed" = true THEN 'DISPENSED'::"PrescriptionStatus" ELSE 'ACTIVE'::"PrescriptionStatus" END
FROM "encounters" e
WHERE p."encounterId" = e."id";

-- If any orphaned prescriptions exist, use a deterministic fallback number
UPDATE "prescriptions"
SET "prescriptionNumber" = COALESCE("prescriptionNumber", 'RX-LEGACY-' || SUBSTRING("id" FROM 1 FOR 8))
WHERE "prescriptionNumber" IS NULL;

-- Enforce non-null after backfill
ALTER TABLE "prescriptions"
  ALTER COLUMN "prescribedById" SET NOT NULL,
  ALTER COLUMN "prescriptionNumber" SET NOT NULL;

-- Drop legacy JSON structure after backfill
ALTER TABLE "prescriptions"
  DROP COLUMN "isDispensed",
  DROP COLUMN "items";

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "drugName" TEXT NOT NULL,
    "genericName" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "route" TEXT,
    "instructions" TEXT,
    "quantityPrescribed" INTEGER NOT NULL,
    "quantityDispensed" INTEGER NOT NULL DEFAULT 0,
    "status" "PrescriptionItemStatus" NOT NULL DEFAULT 'PENDING',
    "substitutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispense_records" (
    "id" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "dispensedById" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispense_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");
CREATE INDEX "prescription_items_inventoryItemId_idx" ON "prescription_items"("inventoryItemId");
CREATE INDEX "prescription_items_status_idx" ON "prescription_items"("status");

CREATE INDEX "dispense_records_prescriptionItemId_idx" ON "dispense_records"("prescriptionItemId");
CREATE INDEX "dispense_records_inventoryItemId_idx" ON "dispense_records"("inventoryItemId");
CREATE INDEX "dispense_records_dispensedById_idx" ON "dispense_records"("dispensedById");

CREATE UNIQUE INDEX "prescriptions_prescriptionNumber_key" ON "prescriptions"("prescriptionNumber");
CREATE INDEX "prescriptions_prescribedById_idx" ON "prescriptions"("prescribedById");
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescribedById_fkey" FOREIGN KEY ("prescribedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "prescription_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "prescription_counters" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_counters_pkey" PRIMARY KEY ("year")
);

-- Backfill: seed each year's counter from the highest existing RX number that
-- year (mirrors prisma/syncBillCounter.js for bills). Prevents number reuse on
-- live databases that already contain prescriptions.
INSERT INTO "prescription_counters" ("year", "lastNumber", "updatedAt")
SELECT
  CAST(SUBSTRING("prescriptionNumber" FROM 4 FOR 4) AS INTEGER) AS year,
  MAX(CAST(SUBSTRING("prescriptionNumber" FROM 9) AS INTEGER))    AS lastNumber,
  NOW()
FROM "prescriptions"
WHERE "prescriptionNumber" ~ '^RX-[0-9]{4}-[0-9]+$'
GROUP BY 1
ON CONFLICT ("year") DO NOTHING;

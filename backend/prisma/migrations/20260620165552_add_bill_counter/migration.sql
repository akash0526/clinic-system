-- CreateTable
CREATE TABLE "bill_counters" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_counters_pkey" PRIMARY KEY ("year")
);

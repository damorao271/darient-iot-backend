-- Add optional office hours to Space
ALTER TABLE "Space" ADD COLUMN "openTime" VARCHAR(5);
ALTER TABLE "Space" ADD COLUMN "closeTime" VARCHAR(5);

-- AlertKind enum
CREATE TYPE "AlertKind" AS ENUM ('CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED');

-- CreateTable DeviceDesired (one-to-one with Space)
CREATE TABLE "DeviceDesired" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "co2AlertThreshold" INTEGER NOT NULL DEFAULT 1000,
    "samplingIntervalSec" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceDesired_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeviceDesired_spaceId_key" ON "DeviceDesired"("spaceId");

-- CreateTable DeviceReported (one-to-one with Space)
CREATE TABLE "DeviceReported" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "co2AlertThreshold" INTEGER,
    "samplingIntervalSec" INTEGER,
    "firmwareVersion" TEXT,
    "ts" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceReported_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeviceReported_spaceId_key" ON "DeviceReported"("spaceId");

-- CreateTable TelemetryAggregation
CREATE TABLE "TelemetryAggregation" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "tempC" DOUBLE PRECISION NOT NULL,
    "humidityPct" DOUBLE PRECISION NOT NULL,
    "co2Ppm" INTEGER NOT NULL,
    "occupancy" INTEGER NOT NULL,
    "powerW" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryAggregation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TelemetryAggregation_spaceId_ts_idx" ON "TelemetryAggregation"("spaceId", "ts" DESC);

-- CreateTable Alert
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "metaJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Alert_spaceId_kind_idx" ON "Alert"("spaceId", "kind");
CREATE INDEX "Alert_spaceId_startedAt_idx" ON "Alert"("spaceId", "startedAt" DESC);

-- AddForeignKey
ALTER TABLE "DeviceDesired" ADD CONSTRAINT "DeviceDesired_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeviceReported" ADD CONSTRAINT "DeviceReported_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TelemetryAggregation" ADD CONSTRAINT "TelemetryAggregation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add timezone to Place (default UTC)
ALTER TABLE "Place" ADD COLUMN "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC';

-- Reservation: migrate to UTC startAt/endAt
-- Step 1: Clear existing reservations (cannot migrate without original timezone)
DELETE FROM "Reservation";

-- Step 2: Add new columns
ALTER TABLE "Reservation" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN "endAt" TIMESTAMP(3);

-- Step 3: Drop old columns
ALTER TABLE "Reservation" DROP COLUMN "reservationDate";
ALTER TABLE "Reservation" DROP COLUMN "startTime";
ALTER TABLE "Reservation" DROP COLUMN "endTime";

-- Step 4: Make new columns required
ALTER TABLE "Reservation" ALTER COLUMN "startAt" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "endAt" SET NOT NULL;

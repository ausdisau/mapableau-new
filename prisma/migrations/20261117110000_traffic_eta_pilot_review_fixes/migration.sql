-- Persist the departure instant used to compose pickup ETA, separate from generatedAt.
ALTER TABLE "transport_route_estimates"
  ADD COLUMN IF NOT EXISTS "departAt" TIMESTAMP(3);

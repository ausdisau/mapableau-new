-- Existing bookings carry no inferred sharing grants.
ALTER TABLE "transport_trips"
  ADD COLUMN "consentScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

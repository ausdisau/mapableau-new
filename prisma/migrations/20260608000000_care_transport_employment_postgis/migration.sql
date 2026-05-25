CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TYPE "OrchestrationEventType"
  ADD VALUE IF NOT EXISTS 'invoice_from_transport_booking';

CREATE TABLE IF NOT EXISTS transport_booking_locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  transport_booking_id TEXT NOT NULL UNIQUE REFERENCES "TransportBooking"(id) ON DELETE CASCADE,
  pickup_point geography(Point, 4326) NOT NULL,
  dropoff_point geography(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transport_booking_locations_pickup_gix
  ON transport_booking_locations
  USING GIST (pickup_point);

CREATE INDEX IF NOT EXISTS transport_booking_locations_dropoff_gix
  ON transport_booking_locations
  USING GIST (dropoff_point);

CREATE TABLE IF NOT EXISTS transport_network_region_locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  organisation_id TEXT NOT NULL REFERENCES "Organisation"(id) ON DELETE CASCADE,
  region_code TEXT,
  service_area geography(MultiPolygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transport_network_region_locations_area_gix
  ON transport_network_region_locations
  USING GIST (service_area);

CREATE INDEX IF NOT EXISTS transport_network_region_locations_org_idx
  ON transport_network_region_locations (organisation_id);

-- CreateEnum
CREATE TYPE "TransportTripRequestStatus" AS ENUM ('requested', 'declined', 'accepted', 'cancelled');

-- CreateEnum
CREATE TYPE "TransportMvpTripStatus" AS ENUM ('requested', 'accepted', 'dispatched', 'driver_en_route', 'arrived_pickup', 'on_board', 'in_transit', 'arrived_dropoff', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "TransportTripStopType" AS ENUM ('pickup', 'dropoff');

-- CreateEnum
CREATE TYPE "TransportMvpVerificationStatus" AS ENUM ('not_provided', 'pending_review', 'verified', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "TransportSafetyCheckPhase" AS ENUM ('pre_trip', 'post_trip');

-- CreateTable
CREATE TABLE "transport_trip_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "status" "TransportTripRequestStatus" NOT NULL DEFAULT 'requested',
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "pickupWindowStart" TIMESTAMP(3) NOT NULL,
    "pickupWindowEnd" TIMESTAMP(3),
    "pickupNotes" TEXT,
    "dropoffNotes" TEXT,
    "passengerCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_trip_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trips" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" "TransportMvpTripStatus" NOT NULL DEFAULT 'accepted',
    "invoicePlaceholderJson" JSONB,
    "participantConfirmedAt" TIMESTAMP(3),
    "participantDisputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trip_stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "stopType" "TransportTripStopType" NOT NULL,
    "addressFull" TEXT NOT NULL,
    "addressSuburb" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "transport_trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_access_needs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "tripId" TEXT,
    "wheelchairRequired" BOOLEAN NOT NULL DEFAULT false,
    "assistedPickup" BOOLEAN NOT NULL DEFAULT false,
    "assistedDropoff" BOOLEAN NOT NULL DEFAULT false,
    "driverAssistanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "mobilityAidsJson" JSONB,
    "assistanceNotes" TEXT,
    "shareAccessibility" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "transport_access_needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trip_events" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStatus" "TransportMvpTripStatus",
    "toStatus" "TransportMvpTripStatus" NOT NULL,
    "message" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "legacyVehicleId" TEXT,
    "displayName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "verificationStatus" "TransportMvpVerificationStatus" NOT NULL DEFAULT 'pending_review',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicle_features" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "rampAvailable" BOOLEAN NOT NULL DEFAULT false,
    "liftAvailable" BOOLEAN NOT NULL DEFAULT false,
    "seatedCapacity" INTEGER NOT NULL DEFAULT 4,
    "wheelchairSpaces" INTEGER NOT NULL DEFAULT 0,
    "assistanceAnimalFriendly" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "transport_vehicle_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_drivers" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "legacyDriverProfileId" TEXT,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "verificationStatus" "TransportMvpVerificationStatus" NOT NULL DEFAULT 'pending_review',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_driver_verifications" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "licenceStatus" "TransportMvpVerificationStatus" NOT NULL DEFAULT 'not_provided',
    "screeningStatus" "TransportMvpVerificationStatus" NOT NULL DEFAULT 'not_provided',
    "accessibilityTrainingStatus" "TransportMvpVerificationStatus" NOT NULL DEFAULT 'not_provided',
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "transport_driver_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_dispatch_assignments" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "eligibilitySnapshot" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_dispatch_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_safety_checks" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "phase" "TransportSafetyCheckPhase" NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_safety_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trip_evidence" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_trip_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_incident_links" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_incident_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transport_trip_requests_participantId_status_idx" ON "transport_trip_requests"("participantId", "status");
CREATE INDEX "transport_trip_requests_organisationId_status_idx" ON "transport_trip_requests"("organisationId", "status");
CREATE UNIQUE INDEX "transport_trips_requestId_key" ON "transport_trips"("requestId");
CREATE INDEX "transport_trips_participantId_status_idx" ON "transport_trips"("participantId", "status");
CREATE INDEX "transport_trips_organisationId_status_idx" ON "transport_trips"("organisationId", "status");
CREATE INDEX "transport_trip_stops_tripId_sequence_idx" ON "transport_trip_stops"("tripId", "sequence");
CREATE UNIQUE INDEX "transport_access_needs_requestId_key" ON "transport_access_needs"("requestId");
CREATE UNIQUE INDEX "transport_access_needs_tripId_key" ON "transport_access_needs"("tripId");
CREATE INDEX "transport_trip_events_tripId_createdAt_idx" ON "transport_trip_events"("tripId", "createdAt");
CREATE INDEX "transport_vehicles_organisationId_idx" ON "transport_vehicles"("organisationId");
CREATE UNIQUE INDEX "transport_vehicle_features_vehicleId_key" ON "transport_vehicle_features"("vehicleId");
CREATE INDEX "transport_drivers_organisationId_idx" ON "transport_drivers"("organisationId");
CREATE INDEX "transport_drivers_userId_idx" ON "transport_drivers"("userId");
CREATE INDEX "transport_driver_verifications_driverId_idx" ON "transport_driver_verifications"("driverId");
CREATE UNIQUE INDEX "transport_dispatch_assignments_tripId_key" ON "transport_dispatch_assignments"("tripId");
CREATE INDEX "transport_dispatch_assignments_driverId_idx" ON "transport_dispatch_assignments"("driverId");
CREATE INDEX "transport_safety_checks_tripId_idx" ON "transport_safety_checks"("tripId");
CREATE UNIQUE INDEX "transport_trip_evidence_tripId_key" ON "transport_trip_evidence"("tripId");
CREATE INDEX "transport_incident_links_tripId_idx" ON "transport_incident_links"("tripId");
CREATE INDEX "transport_incident_links_incidentId_idx" ON "transport_incident_links"("incidentId");

-- AddForeignKey
ALTER TABLE "transport_trip_requests" ADD CONSTRAINT "transport_trip_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_trip_requests" ADD CONSTRAINT "transport_trip_requests_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_trip_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_trip_stops" ADD CONSTRAINT "transport_trip_stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_access_needs" ADD CONSTRAINT "transport_access_needs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_trip_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_access_needs" ADD CONSTRAINT "transport_access_needs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trip_events" ADD CONSTRAINT "transport_trip_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_vehicle_features" ADD CONSTRAINT "transport_vehicle_features_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_drivers" ADD CONSTRAINT "transport_drivers_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_driver_verifications" ADD CONSTRAINT "transport_driver_verifications_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_safety_checks" ADD CONSTRAINT "transport_safety_checks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trip_evidence" ADD CONSTRAINT "transport_trip_evidence_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_incident_links" ADD CONSTRAINT "transport_incident_links_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_incident_links" ADD CONSTRAINT "transport_incident_links_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

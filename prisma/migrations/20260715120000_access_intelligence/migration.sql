-- Access Intelligence tables (production persistence; demo mode uses in-memory fixtures)

CREATE TABLE IF NOT EXISTS "ai_access_passports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "communicationPreferences" JSONB NOT NULL DEFAULT '[]',
    "mobilityAids" JSONB NOT NULL DEFAULT '[]',
    "sharingDefaults" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_access_passports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_access_requirements" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "shareWithVenue" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_access_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_access_places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "operator" TEXT,
    "openingHours" TEXT,
    "baselineScore" DOUBLE PRECISION,
    "accreditationTier" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_access_places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_building_elements" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "geometry" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_building_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_access_features" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "unit" TEXT,
    "sourceType" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "evidenceIds" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_access_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_access_evidence" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "uri" TEXT,
    "measurement" JSONB,
    "calibrationConfirmed" BOOLEAN,
    "status" TEXT NOT NULL,
    "placeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_access_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_route_nodes" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT,
    "label" TEXT NOT NULL,
    "level" TEXT,
    "coordinates" JSONB,
    "nodeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_route_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_route_edges" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "distanceMetres" DOUBLE PRECISION NOT NULL,
    "widthMm" DOUBLE PRECISION,
    "gradientRatio" DOUBLE PRECISION,
    "crossSlope" DOUBLE PRECISION,
    "surface" TEXT,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "handrails" BOOLEAN,
    "lighting" TEXT,
    "noiseLevel" TEXT,
    "tactileGuidance" BOOLEAN,
    "automaticDoor" BOOLEAN,
    "temporaryBarrier" BOOLEAN NOT NULL DEFAULT false,
    "evidenceConfidence" DOUBLE PRECISION NOT NULL,
    "liftAvailable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_route_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_live_incidents" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "affectedEdgeIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_live_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_verification_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "recipient" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_verification_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_barrier_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_barrier_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_visit_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "visitAt" TIMESTAMP(3),
    "accessDecision" JSONB NOT NULL,
    "route" JSONB,
    "arrivalInstructions" JSONB NOT NULL DEFAULT '[]',
    "contingencyInstructions" JSONB NOT NULL DEFAULT '[]',
    "evidenceSummary" JSONB NOT NULL DEFAULT '[]',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_visit_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_access_audit_events" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "purpose" TEXT,
    "fieldsShared" JSONB NOT NULL DEFAULT '[]',
    "recipient" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_access_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_access_passports_userId_idx" ON "ai_access_passports"("userId");
CREATE INDEX IF NOT EXISTS "ai_access_requirements_passportId_idx" ON "ai_access_requirements"("passportId");
CREATE INDEX IF NOT EXISTS "ai_access_requirements_featureType_idx" ON "ai_access_requirements"("featureType");
CREATE INDEX IF NOT EXISTS "ai_access_places_name_idx" ON "ai_access_places"("name");
CREATE INDEX IF NOT EXISTS "ai_building_elements_placeId_idx" ON "ai_building_elements"("placeId");
CREATE INDEX IF NOT EXISTS "ai_access_features_placeId_idx" ON "ai_access_features"("placeId");
CREATE INDEX IF NOT EXISTS "ai_access_features_elementId_idx" ON "ai_access_features"("elementId");
CREATE INDEX IF NOT EXISTS "ai_access_features_featureType_idx" ON "ai_access_features"("featureType");
CREATE INDEX IF NOT EXISTS "ai_access_features_observedAt_idx" ON "ai_access_features"("observedAt");
CREATE INDEX IF NOT EXISTS "ai_access_evidence_status_idx" ON "ai_access_evidence"("status");
CREATE INDEX IF NOT EXISTS "ai_access_evidence_capturedAt_idx" ON "ai_access_evidence"("capturedAt");
CREATE INDEX IF NOT EXISTS "ai_route_nodes_placeId_idx" ON "ai_route_nodes"("placeId");
CREATE INDEX IF NOT EXISTS "ai_route_edges_placeId_idx" ON "ai_route_edges"("placeId");
CREATE INDEX IF NOT EXISTS "ai_route_edges_fromNodeId_toNodeId_idx" ON "ai_route_edges"("fromNodeId", "toNodeId");
CREATE INDEX IF NOT EXISTS "ai_live_incidents_placeId_idx" ON "ai_live_incidents"("placeId");
CREATE INDEX IF NOT EXISTS "ai_live_incidents_status_idx" ON "ai_live_incidents"("status");
CREATE INDEX IF NOT EXISTS "ai_live_incidents_elementId_idx" ON "ai_live_incidents"("elementId");
CREATE INDEX IF NOT EXISTS "ai_verification_requests_userId_idx" ON "ai_verification_requests"("userId");
CREATE INDEX IF NOT EXISTS "ai_verification_requests_placeId_idx" ON "ai_verification_requests"("placeId");
CREATE INDEX IF NOT EXISTS "ai_barrier_reports_userId_idx" ON "ai_barrier_reports"("userId");
CREATE INDEX IF NOT EXISTS "ai_barrier_reports_placeId_idx" ON "ai_barrier_reports"("placeId");
CREATE INDEX IF NOT EXISTS "ai_visit_plans_userId_idx" ON "ai_visit_plans"("userId");
CREATE INDEX IF NOT EXISTS "ai_visit_plans_placeId_idx" ON "ai_visit_plans"("placeId");
CREATE INDEX IF NOT EXISTS "ai_access_audit_events_actorUserId_idx" ON "ai_access_audit_events"("actorUserId");
CREATE INDEX IF NOT EXISTS "ai_access_audit_events_action_idx" ON "ai_access_audit_events"("action");
CREATE INDEX IF NOT EXISTS "ai_access_audit_events_createdAt_idx" ON "ai_access_audit_events"("createdAt");

ALTER TABLE "ai_access_requirements" ADD CONSTRAINT "ai_access_requirements_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "ai_access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_building_elements" ADD CONSTRAINT "ai_building_elements_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_access_features" ADD CONSTRAINT "ai_access_features_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_access_features" ADD CONSTRAINT "ai_access_features_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "ai_building_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_route_nodes" ADD CONSTRAINT "ai_route_nodes_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_route_edges" ADD CONSTRAINT "ai_route_edges_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_live_incidents" ADD CONSTRAINT "ai_live_incidents_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_live_incidents" ADD CONSTRAINT "ai_live_incidents_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "ai_building_elements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_verification_requests" ADD CONSTRAINT "ai_verification_requests_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_barrier_reports" ADD CONSTRAINT "ai_barrier_reports_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_visit_plans" ADD CONSTRAINT "ai_visit_plans_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "ai_access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Access Intelligence Living Building persistence
-- Twin meta, temporal rules, mutation drafts, learning traces, venue staff, live snapshots

CREATE TABLE IF NOT EXISTS "ai_living_twin_meta" (
    "placeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fictionalNotice" TEXT,
    "destinations" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_living_twin_meta_pkey" PRIMARY KEY ("placeId")
);

CREATE TABLE IF NOT EXISTS "ai_temporal_rules" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT,
    "edgeIds" JSONB NOT NULL DEFAULT '[]',
    "ruleType" TEXT NOT NULL,
    "closesAfterHourLocal" INTEGER,
    "opensAtHourLocal" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "effectAvailable" BOOLEAN,
    "effectNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_temporal_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_temporal_rules_placeId_idx" ON "ai_temporal_rules"("placeId");

CREATE TABLE IF NOT EXISTS "ai_venue_mutation_drafts" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mutationId" TEXT NOT NULL,
    "mutation" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_venue_mutation_drafts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_venue_mutation_drafts_placeId_idx" ON "ai_venue_mutation_drafts"("placeId");
CREATE INDEX IF NOT EXISTS "ai_venue_mutation_drafts_userId_idx" ON "ai_venue_mutation_drafts"("userId");
CREATE INDEX IF NOT EXISTS "ai_venue_mutation_drafts_status_idx" ON "ai_venue_mutation_drafts"("status");

CREATE TABLE IF NOT EXISTS "ai_learning_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_learning_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_learning_sessions_userId_idx" ON "ai_learning_sessions"("userId");
CREATE INDEX IF NOT EXISTS "ai_learning_sessions_scenarioId_idx" ON "ai_learning_sessions"("scenarioId");
CREATE INDEX IF NOT EXISTS "ai_learning_sessions_updatedAt_idx" ON "ai_learning_sessions"("updatedAt");

CREATE TABLE IF NOT EXISTS "ai_learning_trace_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_learning_trace_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_learning_trace_events_sessionId_idx" ON "ai_learning_trace_events"("sessionId");
CREATE INDEX IF NOT EXISTS "ai_learning_trace_events_type_idx" ON "ai_learning_trace_events"("type");
CREATE INDEX IF NOT EXISTS "ai_learning_trace_events_createdAt_idx" ON "ai_learning_trace_events"("createdAt");

CREATE TABLE IF NOT EXISTS "ai_venue_staff_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_venue_staff_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ai_venue_staff_assignments_userId_placeId_key" ON "ai_venue_staff_assignments"("userId", "placeId");
CREATE INDEX IF NOT EXISTS "ai_venue_staff_assignments_placeId_idx" ON "ai_venue_staff_assignments"("placeId");
CREATE INDEX IF NOT EXISTS "ai_venue_staff_assignments_userId_idx" ON "ai_venue_staff_assignments"("userId");

CREATE TABLE IF NOT EXISTS "ai_live_status_snapshots" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "elementId" TEXT,
    "feedKey" TEXT NOT NULL,
    "statusPayload" JSONB NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'system_feed',
    "observedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_live_status_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ai_live_status_snapshots_placeId_feedKey_key" ON "ai_live_status_snapshots"("placeId", "feedKey");
CREATE INDEX IF NOT EXISTS "ai_live_status_snapshots_placeId_idx" ON "ai_live_status_snapshots"("placeId");
CREATE INDEX IF NOT EXISTS "ai_live_status_snapshots_observedAt_idx" ON "ai_live_status_snapshots"("observedAt");

DO $$ BEGIN
  ALTER TABLE "ai_learning_trace_events"
    ADD CONSTRAINT "ai_learning_trace_events_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "ai_learning_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

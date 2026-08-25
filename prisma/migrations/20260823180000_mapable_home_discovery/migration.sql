-- MapAble Home discovery (AccessiSpace absorption into Home & Living).
-- Non-destructive: property remains distinct from vacancy; no MarketplaceProduct link.

ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "suburb" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "locationPrecision" TEXT NOT NULL DEFAULT 'SUBURB_ONLY';
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "bedroomCount" INTEGER;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "bathroomCount" INTEGER;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "sdaCategory" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "rentDisplay" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "virtualTourUrl" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "gaisPlaceId" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "listingStatus" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "relatedSupportOrganisationId" TEXT;
ALTER TABLE "accessible_properties" ADD COLUMN IF NOT EXISTS "relatedSupportOrganisationNote" TEXT;

CREATE INDEX IF NOT EXISTS "accessible_properties_listingStatus_suburb_propertyType_idx"
  ON "accessible_properties"("listingStatus", "suburb", "propertyType");
CREATE INDEX IF NOT EXISTS "accessible_properties_listingStatus_publishedAt_idx"
  ON "accessible_properties"("listingStatus", "publishedAt");

CREATE TABLE IF NOT EXISTS "property_vacancies" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "label" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "availableFrom" TIMESTAMP(3),
  "availableTo" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_vacancies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "property_vacancies_propertyId_status_availableFrom_idx"
  ON "property_vacancies"("propertyId", "status", "availableFrom");
DO $$ BEGIN
  ALTER TABLE "property_vacancies"
    ADD CONSTRAINT "property_vacancies_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "property_listing_media" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "caption" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_listing_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "property_listing_media_propertyId_kind_sortOrder_idx"
  ON "property_listing_media"("propertyId", "kind", "sortOrder");
DO $$ BEGIN
  ALTER TABLE "property_listing_media"
    ADD CONSTRAINT "property_listing_media_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "home_shortlist_items" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_shortlist_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "home_shortlist_items_participantId_propertyId_key"
  ON "home_shortlist_items"("participantId", "propertyId");
CREATE INDEX IF NOT EXISTS "home_shortlist_items_participantId_createdAt_idx"
  ON "home_shortlist_items"("participantId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "home_shortlist_items"
    ADD CONSTRAINT "home_shortlist_items_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "home_shortlist_items"
    ADD CONSTRAINT "home_shortlist_items_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "home_enquiries" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "enquiryKind" TEXT NOT NULL DEFAULT 'basic',
  "sharedRequirementKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "home_enquiries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "home_enquiries_conversationId_key"
  ON "home_enquiries"("conversationId");
CREATE INDEX IF NOT EXISTS "home_enquiries_participantId_createdAt_idx"
  ON "home_enquiries"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "home_enquiries_organisationId_createdAt_idx"
  ON "home_enquiries"("organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS "home_enquiries_propertyId_idx"
  ON "home_enquiries"("propertyId");
DO $$ BEGIN
  ALTER TABLE "home_enquiries"
    ADD CONSTRAINT "home_enquiries_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "home_enquiries"
    ADD CONSTRAINT "home_enquiries_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "home_capability_profiles" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "capabilitiesJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "home_capability_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "home_capability_profiles_propertyId_key"
  ON "home_capability_profiles"("propertyId");
DO $$ BEGIN
  ALTER TABLE "home_capability_profiles"
    ADD CONSTRAINT "home_capability_profiles_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

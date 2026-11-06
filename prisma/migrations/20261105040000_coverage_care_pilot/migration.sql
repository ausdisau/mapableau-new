-- Coverage Care white-label pilot tables (LOCAL / REVIEW ONLY).
-- Do not apply to production without explicit human approval.

CREATE TABLE IF NOT EXISTS "coverage_care_tenant_brands" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "colorsJson" JSONB NOT NULL,
    "logoSvg" TEXT,
    "messagingJson" JSONB NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coverage_care_tenant_brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coverage_care_tenant_brands_tenantId_key"
  ON "coverage_care_tenant_brands"("tenantId");

CREATE TABLE IF NOT EXISTS "coverage_care_service_listings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "accessibilityNotes" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'synthetic_demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coverage_care_service_listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coverage_care_service_listings_tenantId_discipline_idx"
  ON "coverage_care_service_listings"("tenantId", "discipline");

CREATE TABLE IF NOT EXISTS "coverage_care_enquiries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "listingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sharePreviewJson" JSONB,
    "consentRecordId" TEXT,
    "providerNotes" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coverage_care_enquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coverage_care_enquiries_tenantId_status_idx"
  ON "coverage_care_enquiries"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "coverage_care_enquiries_participantUserId_idx"
  ON "coverage_care_enquiries"("participantUserId");

CREATE TABLE IF NOT EXISTS "coverage_care_brand_content_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coverage_care_brand_content_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coverage_care_brand_content_items_tenantId_kind_approvalStatus_idx"
  ON "coverage_care_brand_content_items"("tenantId", "kind", "approvalStatus");

CREATE TABLE IF NOT EXISTS "coverage_care_provision_checks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coverage_care_provision_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coverage_care_provision_checks_tenantId_checkCode_idx"
  ON "coverage_care_provision_checks"("tenantId", "checkCode");

ALTER TABLE "coverage_care_tenant_brands"
  ADD CONSTRAINT "coverage_care_tenant_brands_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coverage_care_service_listings"
  ADD CONSTRAINT "coverage_care_service_listings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coverage_care_enquiries"
  ADD CONSTRAINT "coverage_care_enquiries_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coverage_care_enquiries"
  ADD CONSTRAINT "coverage_care_enquiries_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "coverage_care_service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "coverage_care_brand_content_items"
  ADD CONSTRAINT "coverage_care_brand_content_items_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coverage_care_provision_checks"
  ADD CONSTRAINT "coverage_care_provision_checks_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

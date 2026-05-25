-- CreateEnum
CREATE TYPE "AccessFloorPlanStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AccessFloorPlanSourceType" AS ENUM ('admin_uploaded', 'venue_uploaded', 'external_url');

-- CreateEnum
CREATE TYPE "AccessFloorPlanMarkerType" AS ENUM ('entrance', 'exit', 'accessible_toilet', 'lift', 'stairs', 'ramp', 'accessible_parking', 'reception', 'service_counter', 'seating', 'sensory_quiet_area', 'path_of_travel', 'hazard', 'other');

-- CreateEnum
CREATE TYPE "AccessFloorPlanMarkerConfidence" AS ENUM ('venue_provided', 'mapable_verified', 'community_reported');

-- CreateTable
CREATE TABLE "access_floor_plans" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level_label" TEXT,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT NOT NULL,
    "public_notes" TEXT,
    "status" "AccessFloorPlanStatus" NOT NULL DEFAULT 'draft',
    "source_type" "AccessFloorPlanSourceType" NOT NULL DEFAULT 'admin_uploaded',
    "uploaded_by" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_floor_plan_markers" (
    "id" TEXT NOT NULL,
    "floor_plan_id" TEXT NOT NULL,
    "type" "AccessFloorPlanMarkerType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "x_percent" DOUBLE PRECISION NOT NULL,
    "y_percent" DOUBLE PRECISION NOT NULL,
    "confidence" "AccessFloorPlanMarkerConfidence" NOT NULL DEFAULT 'venue_provided',
    "severity" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_floor_plan_markers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_floor_plan_events" (
    "id" TEXT NOT NULL,
    "floor_plan_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_floor_plan_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_floor_plans_place_id_status_idx" ON "access_floor_plans"("place_id", "status");

-- CreateIndex
CREATE INDEX "access_floor_plan_markers_floor_plan_id_sort_order_idx" ON "access_floor_plan_markers"("floor_plan_id", "sort_order");

-- CreateIndex
CREATE INDEX "access_floor_plan_events_floor_plan_id_created_at_idx" ON "access_floor_plan_events"("floor_plan_id", "created_at");

-- AddForeignKey
ALTER TABLE "access_floor_plans" ADD CONSTRAINT "access_floor_plans_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_floor_plans" ADD CONSTRAINT "access_floor_plans_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_floor_plan_markers" ADD CONSTRAINT "access_floor_plan_markers_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "access_floor_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_floor_plan_events" ADD CONSTRAINT "access_floor_plan_events_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "access_floor_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

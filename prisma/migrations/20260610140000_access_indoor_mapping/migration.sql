-- CreateEnum
CREATE TYPE "AccessIndoorPoiType" AS ENUM ('entrance', 'accessible_toilet', 'changing_places', 'lift', 'ramp', 'stairs', 'help_point', 'quiet_room', 'parking', 'reception', 'other');

-- CreateEnum
CREATE TYPE "AccessIndoorPositioningVendor" AS ENUM ('none', 'bindimaps', 'mapsindoors', 'mappedin', 'arcgis_indoors', 'custom');

-- CreateTable
CREATE TABLE "access_venue_buildings" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AccessPlaceStatus" NOT NULL DEFAULT 'draft',
    "external_vendor_id" TEXT,
    "positioning_vendor" "AccessIndoorPositioningVendor" NOT NULL DEFAULT 'none',
    "positioning_embed_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_venue_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_venue_floors" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "level_index" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "AccessPlaceStatus" NOT NULL DEFAULT 'draft',
    "floor_plan_image_url" TEXT,
    "image_bounds" JSONB,
    "vector_geojson" JSONB,
    "width_meters" DOUBLE PRECISION,
    "height_meters" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_venue_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_indoor_pois" (
    "id" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "type" "AccessIndoorPoiType" NOT NULL,
    "name" TEXT NOT NULL,
    "x_norm" DOUBLE PRECISION NOT NULL,
    "y_norm" DOUBLE PRECISION NOT NULL,
    "accessible_route_only" BOOLEAN NOT NULL DEFAULT false,
    "feature_type" "AccessPlaceFeatureType",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_indoor_pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_indoor_edges" (
    "id" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "from_poi_id" TEXT NOT NULL,
    "to_poi_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "requires_stairs" BOOLEAN NOT NULL DEFAULT false,
    "max_grade" DOUBLE PRECISION,
    "min_door_width_cm" INTEGER,
    "accessible_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_indoor_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_venue_buildings_place_id_status_idx" ON "access_venue_buildings"("place_id", "status");

-- CreateIndex
CREATE INDEX "access_venue_floors_building_id_status_idx" ON "access_venue_floors"("building_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "access_venue_floors_building_id_level_index_key" ON "access_venue_floors"("building_id", "level_index");

-- CreateIndex
CREATE INDEX "access_indoor_pois_floor_id_type_idx" ON "access_indoor_pois"("floor_id", "type");

-- CreateIndex
CREATE INDEX "access_indoor_edges_floor_id_idx" ON "access_indoor_edges"("floor_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_indoor_edges_floor_id_from_poi_id_to_poi_id_key" ON "access_indoor_edges"("floor_id", "from_poi_id", "to_poi_id");

-- AddForeignKey
ALTER TABLE "access_venue_buildings" ADD CONSTRAINT "access_venue_buildings_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_venue_floors" ADD CONSTRAINT "access_venue_floors_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "access_venue_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_pois" ADD CONSTRAINT "access_indoor_pois_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "access_venue_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_edges" ADD CONSTRAINT "access_indoor_edges_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "access_venue_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_edges" ADD CONSTRAINT "access_indoor_edges_from_poi_id_fkey" FOREIGN KEY ("from_poi_id") REFERENCES "access_indoor_pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_edges" ADD CONSTRAINT "access_indoor_edges_to_poi_id_fkey" FOREIGN KEY ("to_poi_id") REFERENCES "access_indoor_pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

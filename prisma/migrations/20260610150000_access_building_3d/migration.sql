-- AlterTable
ALTER TABLE "access_venue_buildings" ADD COLUMN "footprint_geojson" JSONB,
ADD COLUMN "base_elevation_meters" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "total_height_meters" DOUBLE PRECISION,
ADD COLUMN "default_floor_height_meters" DOUBLE PRECISION NOT NULL DEFAULT 3.5;

-- AlterTable
ALTER TABLE "access_venue_floors" ADD COLUMN "floor_height_meters" DOUBLE PRECISION,
ADD COLUMN "elevation_meters" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "access_indoor_vertical_edges" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "from_floor_id" TEXT NOT NULL,
    "to_floor_id" TEXT NOT NULL,
    "from_poi_id" TEXT NOT NULL,
    "to_poi_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "requires_stairs" BOOLEAN NOT NULL DEFAULT false,
    "accessible_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_indoor_vertical_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_indoor_vertical_edges_building_id_idx" ON "access_indoor_vertical_edges"("building_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_indoor_vertical_edges_building_id_from_poi_id_to_poi_id_key" ON "access_indoor_vertical_edges"("building_id", "from_poi_id", "to_poi_id");

-- AddForeignKey
ALTER TABLE "access_indoor_vertical_edges" ADD CONSTRAINT "access_indoor_vertical_edges_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "access_venue_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_vertical_edges" ADD CONSTRAINT "access_indoor_vertical_edges_from_floor_id_fkey" FOREIGN KEY ("from_floor_id") REFERENCES "access_venue_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_vertical_edges" ADD CONSTRAINT "access_indoor_vertical_edges_to_floor_id_fkey" FOREIGN KEY ("to_floor_id") REFERENCES "access_venue_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_vertical_edges" ADD CONSTRAINT "access_indoor_vertical_edges_from_poi_id_fkey" FOREIGN KEY ("from_poi_id") REFERENCES "access_indoor_pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_indoor_vertical_edges" ADD CONSTRAINT "access_indoor_vertical_edges_to_poi_id_fkey" FOREIGN KEY ("to_poi_id") REFERENCES "access_indoor_pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

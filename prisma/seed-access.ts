import { PrismaClient } from "@prisma/client";

import { ACCREDITATION_CRITERIA } from "../lib/access-accreditation/accreditation-criteria-service";
import { importIndoorPilot, createRectFootprintGeoJson } from "../lib/access-indoor/indoor-service";

const prisma = new PrismaClient();

async function main() {
  for (const c of ACCREDITATION_CRITERIA) {
    await prisma.accessAccreditationCriterion.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        domain: c.domain,
        title: c.title,
        weight: c.weight,
        sortOrder: ACCREDITATION_CRITERIA.indexOf(c),
      },
      update: {
        domain: c.domain,
        title: c.title,
        weight: c.weight,
      },
    });
  }

  const existing = await prisma.accessPlace.count();
  if (existing === 0) {
    await prisma.accessPlace.create({
      data: {
        name: "MapAble Access Demo Café",
        category: "cafe_restaurant",
        description: "Sample published place for development.",
        addressText: "1 Example Street",
        suburb: "Sydney",
        stateOrRegion: "NSW",
        status: "published",
        sourceType: "manual_admin",
        confidence: "mapable_verified",
        location: {
          create: { latitude: -33.8688, longitude: 151.2093 },
        },
        features: {
          create: [{ type: "step_free_entry" }, { type: "accessible_toilet" }],
        },
      },
    });
  }

  const pilot = await prisma.accessPlace.findFirst({
    where: { category: "shopping_centre", suburb: "Parramatta" },
    include: { location: true },
  });

  const pilotPlace =
    pilot ??
    (await prisma.accessPlace.create({
      data: {
        name: "MapAble Pilot Shopping Centre",
        category: "shopping_centre",
        description:
          "Pilot venue with indoor floor plans and accessible wayfinding.",
        addressText: "100 George Street",
        suburb: "Parramatta",
        stateOrRegion: "NSW",
        status: "published",
        sourceType: "manual_admin",
        confidence: "mapable_verified",
        location: {
          create: { latitude: -33.815, longitude: 151.0031 },
        },
        features: {
          create: [
            { type: "step_free_entry" },
            { type: "lift_access" },
            { type: "accessible_toilet" },
            { type: "accessible_parking" },
          ],
        },
      },
      include: { location: true },
    }));

  const pilotLat = pilotPlace.location?.latitude ?? -33.815;
  const pilotLng = pilotPlace.location?.longitude ?? 151.0031;
  const footprintGeoJson = createRectFootprintGeoJson({
    centerLat: pilotLat,
    centerLng: pilotLng,
    widthMeters: 120,
    heightMeters: 90,
  });
  const nw = footprintGeoJson.coordinates[0][0];
  const se = footprintGeoJson.coordinates[0][2];
  const floorImageBounds = {
    northWest: { lng: nw[0], lat: nw[1] },
    southEast: { lng: se[0], lat: se[1] },
  };

  await importIndoorPilot({
      placeId: pilotPlace.id,
      buildingName: "Main mall",
      footprintGeoJson,
      totalHeightMeters: 7,
      defaultFloorHeightMeters: 3.5,
      verticalEdges: [
        {
          fromFloorLevel: 0,
          toFloorLevel: 1,
          fromPoiName: "Central lift",
          toPoiName: "Central lift — Level 1",
          weight: 2,
        },
      ],
      floors: [
        {
          levelIndex: 0,
          label: "Ground",
          floorPlanImageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Sample_floor_plan.png/640px-Sample_floor_plan.png",
          imageBounds: floorImageBounds,
          pois: [
            {
              type: "entrance",
              name: "Main entrance",
              xNorm: 0.15,
              yNorm: 0.82,
            },
            {
              type: "lift",
              name: "Central lift",
              xNorm: 0.5,
              yNorm: 0.55,
            },
            {
              type: "accessible_toilet",
              name: "Accessible toilet — east wing",
              xNorm: 0.78,
              yNorm: 0.35,
            },
            {
              type: "reception",
              name: "Customer service desk",
              xNorm: 0.35,
              yNorm: 0.65,
            },
          ],
          edges: [
            {
              fromName: "Main entrance",
              toName: "Customer service desk",
            },
            {
              fromName: "Customer service desk",
              toName: "Central lift",
            },
            {
              fromName: "Central lift",
              toName: "Accessible toilet — east wing",
            },
          ],
        },
        {
          levelIndex: 1,
          label: "Level 1",
          imageBounds: floorImageBounds,
          pois: [
            {
              type: "lift",
              name: "Central lift — Level 1",
              xNorm: 0.5,
              yNorm: 0.55,
            },
            {
              type: "quiet_room",
              name: "Quiet room",
              xNorm: 0.25,
              yNorm: 0.4,
            },
            {
              type: "accessible_toilet",
              name: "Accessible toilet — Level 1",
              xNorm: 0.72,
              yNorm: 0.3,
            },
          ],
          edges: [
            {
              fromName: "Central lift — Level 1",
              toName: "Quiet room",
            },
            {
              fromName: "Central lift — Level 1",
              toName: "Accessible toilet — Level 1",
            },
          ],
        },
      ],
    });

  console.log("Access seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

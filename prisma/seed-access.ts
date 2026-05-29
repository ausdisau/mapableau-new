/**
 * Standalone MapAble Access seed — accreditation criteria and optional demo/bulk KML.
 *
 * Usage:
 *   npx tsx prisma/seed-access.ts
 *   SEED_ACCESS_KML=1 npx tsx prisma/seed-access.ts
 *   SEED_ACCESS_KML=1 SEED_ACCESS_PUBLISH=1 npx tsx prisma/seed-access.ts
 */
import { PrismaClient } from "@prisma/client";

import {
  bulkSeedAccessPlaces,
  upsertAccessAccreditationCriteria,
} from "../lib/access-import/bulk-access-seed-service";

const prisma = new PrismaClient();

async function main() {
  await upsertAccessAccreditationCriteria();

  if (process.env.SEED_ACCESS_KML === "1") {
    const concurrency = process.env.SEED_ACCESS_CONCURRENCY
      ? Number(process.env.SEED_ACCESS_CONCURRENCY)
      : undefined;
    const result = await bulkSeedAccessPlaces({
      publish: process.env.SEED_ACCESS_PUBLISH === "1",
      force: process.env.SEED_ACCESS_FORCE === "1",
      concurrency:
        concurrency != null && Number.isFinite(concurrency) ? concurrency : undefined,
    });

    if (result.skipped) {
      console.log(`Bulk KML seed skipped: ${result.reason}`);
    } else {
      console.log(
        `Bulk KML seed: ${result.created} created, ${result.conflicts} conflicts, ${result.parsed} parsed`
      );
    }
    return;
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

  console.log("Access seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

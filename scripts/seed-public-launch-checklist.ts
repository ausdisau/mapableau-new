/**
 * Upsert the full public launch checklist into LaunchReadinessItem.
 * Usage: pnpm exec tsx scripts/seed-public-launch-checklist.ts
 */
import { PUBLIC_LAUNCH_CHECKLIST } from "../lib/launch-readiness/public-launch-checklist";
import {
  getLaunchReadinessSummary,
  seedDefaultLaunchItems,
} from "../lib/launch-readiness/launch-readiness-service";
import { prisma } from "../lib/prisma";

async function main() {
  console.log(
    `Seeding ${PUBLIC_LAUNCH_CHECKLIST.length} public launch checklist items...`
  );
  await seedDefaultLaunchItems();
  const summary = await getLaunchReadinessSummary();
  console.log(
    `Done. ${summary.total} items in DB (expected ${summary.expectedChecklistTotal}).`
  );
  console.log(
    `Ready/waived: ${summary.ready}/${summary.total} (${summary.percent}%). productionReady=${summary.productionReady}`
  );
  if (!summary.checklistComplete) {
    console.warn(
      "Warning: checklist row count is below catalog — check MOBILE_PRODUCTION_READINESS_ENABLED and migrations."
    );
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

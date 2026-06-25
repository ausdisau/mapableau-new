#!/usr/bin/env tsx
/**
 * Expire stale access alerts. Run via cron (e.g. daily).
 */
import { expireStaleAlerts } from "@/lib/access-alerts/access-alert-service";
import { prisma } from "@/lib/prisma";

async function main() {
  const count = await expireStaleAlerts();
  console.log(`Expired ${count} access alert(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

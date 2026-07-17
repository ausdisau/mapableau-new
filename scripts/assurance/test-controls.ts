import { executeControlTest } from "@/lib/assurance/testing/control-test-service";
import { prisma } from "@/lib/prisma";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["run_active_control_tests"] }, null, 2));
    return;
  }

  const tests = await prisma.assuranceControlTest.findMany({ where: { active: true }, take: 50 });
  const results = [];
  for (const test of tests) {
    results.push(await executeControlTest({ testId: test.id }));
  }
  console.log(JSON.stringify({ ran: results.length, results }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

import { seedAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["seedAssuranceFrameworks"] }, null, 2));
    return;
  }
  const result = await seedAssuranceFrameworks();
  console.log(JSON.stringify({ seeded: result.seeded }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

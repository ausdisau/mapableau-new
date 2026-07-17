import {
  ACTIVE_ACTIVE_ENABLED,
  CURRENT_REGION,
  describeRegionalPosture,
} from "@/lib/resilience/regions";
import {
  describeFailoverPosture,
  honestFailoverStatement,
} from "@/lib/resilience/failover";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    regional: describeRegionalPosture(),
    failover: honestFailoverStatement(),
    exercises: describeFailoverPosture(),
    invariants: {
      singleRegion: CURRENT_REGION === "au-southeast",
      activeActiveDisabled: ACTIVE_ACTIVE_ENABLED === false,
    },
  };
  const file = writeArtifact("platform", `resilience-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

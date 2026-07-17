import { checkArchitectureDrift } from "@/lib/assurance/architecture/drift-check";
import { phase5Config } from "@/lib/config/phase5";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  const findings = checkArchitectureDrift({
    expectedAdapterModes: ["ndia_simulator", "ndia_manual_portal", "ndia_direct_future"],
    actualAdapterModes: ["ndia_simulator", "ndia_manual_portal", "ndia_direct_future"],
    directNdiaWithoutApproval: phase5Config.ndiaRealSubmissionEnabled,
  });

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        findings,
        note: "Drift check is advisory; direct NDIA without approval is high severity.",
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

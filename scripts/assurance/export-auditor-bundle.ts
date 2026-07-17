import { exportAuditorBundle } from "@/lib/assurance/reports/auditor-export-service";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["export_auditor_bundle_json"] }, null, 2));
    return;
  }
  const result = await exportAuditorBundle({ organisationId: args.organisationId });
  console.log(JSON.stringify({ file: result.file }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

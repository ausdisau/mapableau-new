import { listGoLiveAssessments } from "@/lib/assurance/go-live/go-live-service";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["list_go_live_assessments"] }, null, 2));
    return;
  }
  const assessments = await listGoLiveAssessments(args.organisationId);
  console.log(
    JSON.stringify(
      {
        count: assessments.length,
        decisions: assessments.map((a) => ({
          id: a.id,
          decision: a.decision,
          featureFlagsSatisfied: a.featureFlagsSatisfied,
        })),
        note: "Feature flags alone never pass go-live.",
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

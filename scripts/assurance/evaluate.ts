import { seedAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";
import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { projectAssuranceReadiness } from "@/lib/assurance/readiness/readiness-projection";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          would: ["seed_frameworks_if_enabled", "evaluate_assurance_readiness"],
          disclaimer: "Dry-run only — no DB writes required.",
        },
        null,
        2
      )
    );
    return;
  }

  await seedAssuranceFrameworks();
  const result = await evaluateAssuranceReadiness({
    organisationId: args.organisationId,
  });
  console.log(JSON.stringify(projectAssuranceReadiness(result), null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

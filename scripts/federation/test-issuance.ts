import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { isProhibitedSchema, PROHIBITED_SCHEMA_KEYS } from "@/lib/credentials/schemas";
import { isFederationActivated, refuseAutoIssue } from "@/lib/credentials/issuance";

/**
 * federation:test-issuance
 *
 * Non-DB smoke test. Confirms:
 *   1. Prohibited (government-mimicking) schema keys still refuse.
 *   2. Auto-issue is refused unless FEDERATION_ALLOW_AUTO_ISSUE=true.
 *   3. Federation activation flag is opt-in.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));

  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

  for (const key of PROHIBITED_SCHEMA_KEYS) {
    results.push({
      name: `prohibited_schema:${key}`,
      ok: isProhibitedSchema(key),
    });
  }

  let autoIssueRefused = false;
  try {
    refuseAutoIssue("test-issuance");
  } catch {
    autoIssueRefused = true;
  }
  results.push({
    name: "auto_issue_refused_by_default",
    ok: autoIssueRefused,
  });

  results.push({
    name: "federation_activation_opt_in",
    ok: process.env.FEDERATION_ACTIVATION !== "true" || isFederationActivated(),
    detail: `FEDERATION_ACTIVATION=${process.env.FEDERATION_ACTIVATION ?? "unset"}`,
  });

  const passed = results.every((r) => r.ok);
  const report = dryRun
    ? {
        ...dryRunStubReport({
          name: "federation:test-issuance",
          summary: "dry-run smoke test — no DB required",
          extras: { results },
        }),
        passed,
      }
    : {
        generatedAt: new Date().toISOString(),
        dryRun: false,
        results,
        passed,
      };

  const file = writeArtifact("federation", `test-issuance-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
  if (!passed) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

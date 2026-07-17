import {
  hasAllRequiredApprovals,
  missingApprovals,
  requiredApprovalsFor,
} from "@/lib/releases/approvals";
import { isPromotable, RELEASE_RING_ORDER } from "@/lib/releases/rings";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const file = writeArtifact(
      "platform",
      `test-release-rings-${ts()}.json`,
      {
        generatedAt: new Date().toISOString(),
        dryRun: true,
        would: ["evaluate_without_db_writes"],
        note: "Dry-run only — no database connection required.",
      }
    );
    console.log(JSON.stringify({ dryRun: true, report: file }, null, 2));
    return;
  }
  const cases = [] as Array<{
    ring: string;
    required: string[];
    missingWhenEmpty: string[];
    canPromoteToNext: boolean;
  }>;
  for (let i = 0; i < RELEASE_RING_ORDER.length; i++) {
    const ring = RELEASE_RING_ORDER[i];
    const next = RELEASE_RING_ORDER[i + 1];
    cases.push({
      ring,
      required: requiredApprovalsFor(ring),
      missingWhenEmpty: missingApprovals(ring, []),
      canPromoteToNext: next ? isPromotable(ring, next) : false,
    });
  }
  const allPass =
    cases.every(
      (c) => !hasAllRequiredApprovals(c.ring as never, []) || c.required.length === 0
    ) && cases.every((c) => c.missingWhenEmpty.length === c.required.length);
  const file = writeArtifact("platform", `release-rings-${ts()}.json`, {
    generatedAt: new Date().toISOString(),
    dryRun,
    cases,
    pass: allPass,
  });
  console.log(JSON.stringify(cases, null, 2));
  console.log(`report: ${file}`);
  if (!allPass) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

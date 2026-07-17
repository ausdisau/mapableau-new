import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-graph",
    "Graph tests: node upsert, dependency edges, cycle detection.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

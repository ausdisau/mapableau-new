import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-provider-failure-paths",
    "Pack wrapper: audit provider failure paths (wind-down, closure, suspension).",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

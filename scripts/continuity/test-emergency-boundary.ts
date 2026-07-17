import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-emergency-boundary",
    "Emergency boundary tests: AURA cannot invoke 000, ambulance, police, or fire dispatch.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

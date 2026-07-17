import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-simulation",
    "Recovery plan simulation tests: zero external writes.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

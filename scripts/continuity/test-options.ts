import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-options",
    "Recovery option builder tests: deterministic eligibility, no_safe_option always available.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

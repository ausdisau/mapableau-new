import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-accessibility",
    "Accessibility tests: plain-language disclaimers, interpreter-required propagation.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

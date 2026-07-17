import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-continuity-consent",
    "Pack wrapper: audit continuity communications for consent-gated channels.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

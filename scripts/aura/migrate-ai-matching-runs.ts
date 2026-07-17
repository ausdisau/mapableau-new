import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:migrate-ai-matching-runs",
    "dry-run helper to migrate legacy AiMatchRun rows to explicit ruleScore vs modelCommentaryScore semantics",
    {
      disclaimers: [
        "AURA is not sentient.",
        "AURA cannot approve invoices, claims, or payments.",
        "All participant-data egress goes via discloseParticipantData.",
      ],
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

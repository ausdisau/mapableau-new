import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:classify-agent-actions",
    "classify AuraActionDefinition rows by risk tier using lib/ai-assurance/risk-assessment/scoring.ts",
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
